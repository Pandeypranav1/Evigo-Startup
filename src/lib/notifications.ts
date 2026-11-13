import { createAdminClient } from "@/lib/supabase";
import {
  sendNewBookingEmailToProvider,
  sendBookingAcceptedEmailToClient,
  sendBookingRejectedEmailToClient,
  sendBookingCancelledEmailToProvider,
  sendBookingReceivedEmailToClient,
  sendBookingCompletedEmailToClient,
} from "@/lib/email";

export interface CreateNotificationParams {
  userId: string;
  bookingId?: string | null;
  title: string;
  message: string;
  type:
    | "booking_received"
    | "booking_new"
    | "booking_confirmed"
    | "booking_rejected"
    | "booking_cancelled"
    | "booking_completed";
  dedupeKey?: string | null;
}

type AdminClient = ReturnType<typeof createAdminClient>;

function isDuplicateKeyError(error: any): boolean {
  return error?.code === "23505";
}

async function findNotificationByDedupeKey(
  supabase: AdminClient,
  userId: string,
  dedupeKey: string
) {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();
  return data;
}

async function logInAppDelivery(
  supabase: AdminClient,
  params: {
    userId: string;
    bookingId?: string | null;
    eventType: string;
    status: "sent" | "failed" | "skipped";
    dedupeKey?: string | null;
    lastError?: string | null;
  }
) {
  try {
    await supabase.from("notification_deliveries").insert({
      user_id: params.userId,
      booking_id: params.bookingId || null,
      channel: "in_app",
      event_type: params.eventType,
      status: params.status,
      attempts: params.status === "failed" ? 1 : 0,
      last_error: params.lastError || null,
      dedupe_key: params.dedupeKey || null,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.warn("[Notifications] Failed to write in-app delivery log:", err);
  }
}

/**
 * Server-side creation of notification records in public.notifications.
 * Must not be callable from unauthenticated or spoofed client requests.
 *
 * When `dedupeKey` is provided, duplicate inserts for the same
 * (user_id, dedupe_key) pair are ignored and the existing row is returned,
 * which prevents repeat notifications on retried requests.
 */
export async function createNotificationServer({
  userId,
  bookingId,
  title,
  message,
  type,
  dedupeKey,
}: CreateNotificationParams) {
  try {
    if (!userId) {
      console.warn("[Notifications] Cannot create notification: Missing userId");
      return null;
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        booking_id: bookingId || null,
        title,
        message,
        type,
        is_read: false,
        dedupe_key: dedupeKey || null,
      })
      .select()
      .single();

    if (error) {
      if (dedupeKey && isDuplicateKeyError(error)) {
        const existing = await findNotificationByDedupeKey(supabase, userId, dedupeKey);
        if (existing) return existing;
      }
      console.error("[Notifications] Failed to insert notification:", error);
      await logInAppDelivery(supabase, {
        userId,
        bookingId,
        eventType: type,
        status: "failed",
        dedupeKey,
        lastError: error?.message || "insert failed",
      });
      return null;
    }

    await logInAppDelivery(supabase, {
      userId,
      bookingId,
      eventType: type,
      status: "sent",
      dedupeKey,
    });

    return data;
  } catch (err: any) {
    console.error("[Notifications] Unexpected error creating notification:", err);
    return null;
  }
}

// ── Templated Email Delivery ─────────────────────────────────────

type EmailTemplateParams = Record<string, unknown>;

type EmailTemplateFn = (params: any) => Promise<{ success: boolean; error?: string; skipped?: boolean }>;

const EMAIL_TEMPLATES: Record<string, EmailTemplateFn> = {
  booking_new_provider: sendNewBookingEmailToProvider,
  booking_received_client: sendBookingReceivedEmailToClient,
  booking_accepted_client: sendBookingAcceptedEmailToClient,
  booking_rejected_client: sendBookingRejectedEmailToClient,
  booking_cancelled_provider: sendBookingCancelledEmailToProvider,
  booking_completed_client: sendBookingCompletedEmailToClient,
};

export interface DispatchEmailParams {
  template: keyof typeof EMAIL_TEMPLATES | string;
  params: EmailTemplateParams;
  userId?: string | null;
  bookingId?: string | null;
  eventType: string;
  dedupeKey?: string | null;
  recipient: string;
  subject?: string | null;
}

const MAX_SEND_ATTEMPTS = 2;

async function alreadyDelivered(
  supabase: AdminClient,
  channel: "in_app" | "email",
  dedupeKey: string
): Promise<boolean> {
  // Any recorded attempt for this dedupe key means the event was already
  // dispatched; failed rows are retried explicitly via retryEmailDelivery
  // so a send is never duplicated automatically.
  const { data } = await supabase
    .from("notification_deliveries")
    .select("id")
    .eq("channel", channel)
    .eq("dedupe_key", dedupeKey)
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

async function recordEmailDelivery(
  supabase: AdminClient,
  entry: {
    userId?: string | null;
    bookingId?: string | null;
    eventType: string;
    recipient: string;
    subject?: string | null;
    status: "pending" | "sent" | "failed" | "skipped";
    attempts: number;
    lastError?: string | null;
    dedupeKey?: string | null;
    payload?: unknown;
    sentAt?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("notification_deliveries")
    .insert({
      user_id: entry.userId || null,
      booking_id: entry.bookingId || null,
      channel: "email",
      event_type: entry.eventType,
      recipient: entry.recipient,
      subject: entry.subject || null,
      status: entry.status,
      attempts: entry.attempts,
      last_error: entry.lastError || null,
      dedupe_key: entry.dedupeKey || null,
      payload: entry.payload ?? null,
      sent_at: entry.sentAt || null,
    })
    .select("id")
    .single();

  if (error) {
    // Unique violation on (channel, dedupe_key): a delivery already exists.
    if (entry.dedupeKey && isDuplicateKeyError(error)) return null;
    console.warn("[Notifications] Failed to record email delivery:", error);
    return null;
  }
  return data?.id as string | undefined;
}

/**
 * Sends a templated notification email with delivery logging.
 *
 * - Never throws; callers can safely fire-and-forget after a booking succeeds.
 * - Dedupes on (channel='email', dedupe_key) once a 'sent' delivery exists.
 * - Retries once inline on failure, then records status='failed' so an
 *   administrator can retry later via retryEmailDelivery().
 * - Stores { template, params } in payload for safe later retries.
 */
export async function dispatchEmailNotification({
  template,
  params,
  userId,
  bookingId,
  eventType,
  dedupeKey,
  recipient,
  subject,
}: DispatchEmailParams): Promise<{ success: boolean; skipped?: boolean; deliveryId?: string | null }> {
  try {
    const sendFn = EMAIL_TEMPLATES[template];
    if (!sendFn) {
      console.warn(`[Notifications] Unknown email template: ${template}`);
      return { success: false };
    }

    const supabase = createAdminClient();

    if (dedupeKey && (await alreadyDelivered(supabase, "email", dedupeKey))) {
      return { success: true };
    }

    const payload = { template, params };
    let lastError: string | undefined;
    let result: { success: boolean; error?: string; skipped?: boolean } = { success: false };
    let attempts = 0;

    while (attempts < MAX_SEND_ATTEMPTS) {
      attempts += 1;
      result = await sendFn(params);
      if (result.success || result.skipped) break;
      lastError = result.error;
      if (attempts < MAX_SEND_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
    }

    const status = result.success ? "sent" : result.skipped ? "skipped" : "failed";
    const deliveryId = await recordEmailDelivery(supabase, {
      userId,
      bookingId,
      eventType,
      recipient,
      subject,
      status,
      attempts,
      lastError: lastError || result.error || null,
      dedupeKey,
      payload,
      sentAt: status === "sent" ? new Date().toISOString() : null,
    });

    return { success: result.success, skipped: result.skipped, deliveryId };
  } catch (err: any) {
    console.error(`[Notifications] dispatchEmailNotification(${template}) failed:`, err);
    return { success: false };
  }
}

/**
 * Retries a previously failed email delivery. Only 'failed' rows whose
 * payload still references a known template are eligible. Safe to call
 * multiple times: each call performs one send attempt and updates the row.
 */
export async function retryEmailDelivery(deliveryId: string) {
  const supabase = createAdminClient();

  const { data: delivery, error } = await supabase
    .from("notification_deliveries")
    .select("*")
    .eq("id", deliveryId)
    .eq("channel", "email")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!delivery) return { success: false, error: "Delivery not found" };
  if (delivery.status !== "failed") {
    return { success: false, error: `Delivery is not in a retryable state (status: ${delivery.status})` };
  }

  const payload = delivery.payload as { template?: string; params?: EmailTemplateParams } | null;
  const sendFn = payload?.template ? EMAIL_TEMPLATES[payload.template] : undefined;
  if (!sendFn || !payload?.params || !delivery.recipient) {
    return { success: false, error: "Delivery payload is missing template or recipient" };
  }

  const result = await sendFn(payload.params);
  const status = result.success ? "sent" : result.skipped ? "skipped" : "failed";

  const { error: updateError } = await supabase
    .from("notification_deliveries")
    .update({
      status,
      attempts: (delivery.attempts || 0) + 1,
      last_error: result.success || result.skipped ? null : result.error || "retry failed",
      sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", deliveryId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: result.success, status };
}
