"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { useAuth } from "@/context/AuthContext";
import { isAllowedAdminEmail } from "@/lib/admin";

type SupportMessage = {
    id: string;
    name: string | null;
    email: string | null;
    message: string | null;
    status: string | null;
    created_at: string | null;
};

type Delivery = {
    id: string;
    channel: string;
    event_type: string;
    recipient: string | null;
    subject: string | null;
    status: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
    sent_at: string | null;
};

const MESSAGE_STATUSES = ["new", "in_progress", "resolved", "archived"] as const;
const DELIVERY_STATUSES = ["failed", "skipped", "sent", "all"] as const;

export default function AdminSupportPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const isAdmin = !!user?.email && isAllowedAdminEmail(user.email);

    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [deliveryFilter, setDeliveryFilter] = useState<string>("failed");
    const [newCount, setNewCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [retryingId, setRetryingId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            setLoadingData(true);
            setError(null);

            const [messagesRes, deliveriesRes] = await Promise.all([
                fetch(`/api/admin/contact-messages?status=${statusFilter}`, { cache: "no-store" }),
                fetch(`/api/admin/notification-deliveries?status=${deliveryFilter}`, { cache: "no-store" }),
            ]);

            const messagesPayload = await messagesRes.json();
            const deliveriesPayload = await deliveriesRes.json();

            if (!messagesRes.ok || !messagesPayload.success) {
                throw new Error(messagesPayload.error || "Unable to load support messages.");
            }
            if (!deliveriesRes.ok || !deliveriesPayload.success) {
                throw new Error(deliveriesPayload.error || "Unable to load notification deliveries.");
            }

            setMessages(messagesPayload.messages ?? []);
            setNewCount(messagesPayload.summary?.new ?? 0);
            setDeliveries(deliveriesPayload.deliveries ?? []);
        } catch (err: any) {
            setError(err.message || "Unable to load support data.");
        } finally {
            setLoadingData(false);
        }
    }, [deliveryFilter, statusFilter, user]);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace("/login");
            return;
        }
        if (!isAdmin) {
            router.replace("/");
            return;
        }
        void loadData();
    }, [loading, user, isAdmin, router, loadData]);

    const handleMessageStatus = async (message: SupportMessage, status: string) => {
        setUpdatingId(message.id);
        setError(null);
        try {
            const response = await fetch("/api/admin/contact-messages", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: message.id, status }),
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || "Unable to update message status.");
            }
            await loadData();
        } catch (err: any) {
            setError(err.message || "Unable to update message status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRetryDelivery = async (delivery: Delivery) => {
        setRetryingId(delivery.id);
        setError(null);
        try {
            const response = await fetch("/api/admin/notification-deliveries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ delivery_id: delivery.id }),
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || "Unable to retry delivery.");
            }
            await loadData();
        } catch (err: any) {
            setError(err.message || "Unable to retry delivery.");
        } finally {
            setRetryingId(null);
        }
    };

    if (loading || !user) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">Loading…</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 py-10 text-zinc-900">
            <Container>
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-violet-700">
                            Admin Access
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Support & Notifications</h1>
                    </div>
                    <div className="text-sm font-semibold text-zinc-500">Signed in as {user.email}</div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">New Messages</div>
                        <div className="mt-3 text-3xl font-black text-zinc-900">{newCount}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Messages Shown</div>
                        <div className="mt-3 text-3xl font-black text-zinc-900">{messages.length}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Deliveries ({deliveryFilter})</div>
                        <div className="mt-3 text-3xl font-black text-zinc-900">{deliveries.length}</div>
                    </div>
                </div>

                {error && (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                )}

                {/* Support messages */}
                <div className="mt-8">
                    <h2 className="text-xl font-black text-zinc-900">Contact Form Submissions</h2>
                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap gap-2">
                            {["all", ...MESSAGE_STATUSES].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${statusFilter === s
                                        ? "bg-zinc-900 text-white"
                                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                        }`}
                                >
                                    {s.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4">
                        {loadingData ? (
                            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-500">
                                Loading support messages…
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-500">
                                No support messages match this filter.
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div key={message.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-1">
                                            <div className="text-lg font-black text-zinc-900">{message.name || "Anonymous"}</div>
                                            <div className="text-sm font-semibold text-zinc-600">{message.email || "No email"}</div>
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{message.message}</div>
                                            <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold text-zinc-500">
                                                <span className="rounded-full bg-zinc-100 px-2.5 py-1">Status: {message.status || "new"}</span>
                                                <span className="rounded-full bg-zinc-100 px-2.5 py-1">
                                                    {message.created_at ? new Date(message.created_at).toLocaleString() : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {MESSAGE_STATUSES.filter((s) => s !== message.status).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => void handleMessageStatus(message, s)}
                                                    disabled={updatingId === message.id}
                                                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                                                >
                                                    {updatingId === message.id ? "Updating…" : `Mark ${s.replace("_", " ")}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Notification deliveries */}
                <div className="mt-10">
                    <h2 className="text-xl font-black text-zinc-900">Notification Deliveries</h2>
                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap gap-2">
                            {DELIVERY_STATUSES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setDeliveryFilter(s)}
                                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${deliveryFilter === s
                                        ? "bg-zinc-900 text-white"
                                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-200 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
                                    <th className="px-4 py-3">When</th>
                                    <th className="px-4 py-3">Channel</th>
                                    <th className="px-4 py-3">Event</th>
                                    <th className="px-4 py-3">Recipient</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Attempts</th>
                                    <th className="px-4 py-3">Error</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingData ? (
                                    <tr><td colSpan={8} className="px-4 py-6 text-center font-semibold text-zinc-500">Loading deliveries…</td></tr>
                                ) : deliveries.length === 0 ? (
                                    <tr><td colSpan={8} className="px-4 py-6 text-center font-semibold text-zinc-500">No deliveries match this filter.</td></tr>
                                ) : (
                                    deliveries.map((delivery) => (
                                        <tr key={delivery.id} className="border-b border-zinc-100 last:border-0">
                                            <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                                                {new Date(delivery.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-zinc-700">{delivery.channel}</td>
                                            <td className="px-4 py-3 text-zinc-700">{delivery.event_type}</td>
                                            <td className="px-4 py-3 text-zinc-600">{delivery.recipient || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                                    delivery.status === "sent" ? "bg-emerald-100 text-emerald-700"
                                                    : delivery.status === "failed" ? "bg-red-100 text-red-700"
                                                    : "bg-zinc-100 text-zinc-600"
                                                }`}>
                                                    {delivery.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-600">{delivery.attempts}</td>
                                            <td className="px-4 py-3 max-w-[220px] truncate text-zinc-500" title={delivery.last_error || ""}>
                                                {delivery.last_error || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {delivery.channel === "email" && delivery.status === "failed" && (
                                                    <button
                                                        onClick={() => void handleRetryDelivery(delivery)}
                                                        disabled={retryingId === delivery.id}
                                                        className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-700 disabled:opacity-50"
                                                    >
                                                        {retryingId === delivery.id ? "Retrying…" : "Retry"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Container>
        </main>
    );
}
