import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/server';

interface ContactMessage {
  name: string;
  email: string;
  message: string;
  website?: string; // honeypot — must stay empty
}

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 5000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 5;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePayload(payload: any): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Invalid request body';
  }
  const { name, email, message } = payload as ContactMessage;
  if (typeof name !== 'string' || !name.trim()) return 'Name is required';
  if (name.trim().length > MAX_NAME) return 'Name is too long';
  if (typeof email !== 'string' || !email.trim()) return 'Email is required';
  if (email.trim().length > MAX_EMAIL) return 'Email is too long';
  if (!EMAIL_REGEX.test(email.trim())) return 'Invalid email address';
  if (typeof message !== 'string' || !message.trim()) return 'Message is required';
  if (message.trim().length < MIN_MESSAGE) return 'Message is too short';
  if (message.trim().length > MAX_MESSAGE) return 'Message is too long';
  return null;
}

function hashIp(ip: string): string {
  const salt = process.env.CONTACT_IP_HASH_SALT || 'evigo-contact-v1';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

async function recentSubmissionCount(
  supabase: ReturnType<typeof createAdminClient>,
  column: 'email' | 'ip_hash',
  value: string,
  cutoffIso: string
): Promise<number | null> {
  let query = supabase
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', cutoffIso);

  const escaped = value.replace(/[%_\\]/g, (ch) => `\\${ch}`);
  query = column === 'email'
    ? query.ilike('email', escaped)
    : query.eq('ip_hash', value);

  const { count, error } = await query;
  if (error) {
    console.error('[contact] rate-limit lookup failed:', error);
    return null;
  }
  return count ?? 0;
}

export async function POST(req: Request) {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    // Honeypot: bots fill hidden fields. Pretend success, store nothing.
    const honeypot = (payload as ContactMessage | null)?.website;
    if (typeof honeypot === 'string' && honeypot.trim()) {
      return NextResponse.json({ message: 'Message sent successfully!' }, { status: 200 });
    }

    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { name, email, message } = payload as ContactMessage;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    const ip = clientIp(req);
    const ipHash = ip === 'unknown' ? null : hashIp(ip);
    const userAgent = (req.headers.get('user-agent') || '').slice(0, 300) || null;

    // Optional: link submission to a signed-in account when present.
    let submittedBy: string | null = null;
    try {
      const { user } = await getAuthenticatedUser();
      submittedBy = user?.id ?? null;
    } catch {
      submittedBy = null;
    }

    const supabase = createAdminClient();
    const cutoffIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    // Rate limiting: per-email and per-IP submission caps.
    const [emailCount, ipCount] = await Promise.all([
      recentSubmissionCount(supabase, 'email', trimmedEmail, cutoffIso),
      ipHash ? recentSubmissionCount(supabase, 'ip_hash', ipHash, cutoffIso) : Promise.resolve(0),
    ]);

    // If the rate-limit lookup itself fails, fail closed for safety.
    if (emailCount === null || ipCount === null) {
      return NextResponse.json(
        { error: 'Unable to process your message right now. Please try again later.' },
        { status: 503 }
      );
    }
    if (emailCount >= MAX_PER_EMAIL || (ipCount ?? 0) >= MAX_PER_IP) {
      return NextResponse.json(
        { error: 'Too many messages sent recently. Please try again later.' },
        { status: 429 }
      );
    }

    const { error } = await supabase.from('contact_messages').insert({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      ip_hash: ipHash,
      user_agent: userAgent,
      submitted_by: submittedBy,
      status: 'new',
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save your message. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Message sent successfully!' }, { status: 200 });
  } catch (err: any) {
    console.error('Unexpected error in /api/contact:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
