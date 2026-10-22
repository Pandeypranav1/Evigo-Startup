import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase';
import { PaymentService } from '@/lib/payment/service';
import { createGatewayAdapter } from '@/lib/payment/adapters';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const secret = process.env.PAYMENT_ENV === 'production'
      ? process.env.RAZORPAY_WEBHOOK_SECRET
      : process.env.RAZORPAY_WEBHOOK_SECRET_SANDBOX;
    if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    const signature = request.headers.get('x-razorpay-signature') || '';
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (Buffer.byteLength(signature) !== Buffer.byteLength(expected) ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    let payload;
    try { payload = JSON.parse(body); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const eventId = request.headers.get('x-razorpay-event-id');
    if (!eventId || !payload?.event) return NextResponse.json({ error: 'Missing event metadata' }, { status: 400 });
    if (!['payment.captured', 'order.paid', 'payment.failed'].includes(payload.event)) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const supabase = createAdminClient();
    const hash = crypto.createHash('sha256').update(body).digest('hex');
    const { data: existing, error: lookupError } = await supabase.from('payment_webhook_events')
      .select('payload_hash,processing_status').eq('gateway', 'razorpay').eq('event_id', eventId).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing && existing.payload_hash !== hash) {
      return NextResponse.json({ error: 'Event payload mismatch' }, { status: 400 });
    }
    if (existing?.processing_status === 'completed') return NextResponse.json({ success: true });
    if (!existing) {
      const { error } = await supabase.from('payment_webhook_events').insert({
        gateway: 'razorpay', event_id: eventId, event_type: payload.event,
        payload_hash: hash, processing_status: 'processing',
      });
      // Let Razorpay retry a concurrent delivery. Settlement itself is atomic.
      if (error) throw error;
    }

    try {
      const entity = payload.payload?.payment?.entity;
      const order = payload.payload?.order?.entity;
      const orderId = entity?.order_id || order?.id;
      if (!orderId) throw new Error('Missing order ID');
      const { data: payment, error } = await supabase.from('payments').select('*')
        .eq('gateway', 'razorpay').eq('gateway_order_id', orderId).single();
      if (error || !payment) throw new Error('Payment order not yet available');
      const amount = entity?.amount ?? order?.amount;
      const currency = entity?.currency ?? order?.currency;
      if (Number(amount) !== Math.round(Number(payment.amount) * 100) || currency !== payment.currency) {
        throw new Error('Payment amount or currency mismatch');
      }
      if (payload.event === 'payment.failed') {
        await PaymentService.processFailedPayment(payment.id, entity?.error_description || 'Payment failed');
      } else {
        let paymentId = entity?.id;
        if (!paymentId) {
          const result = await createGatewayAdapter('razorpay').getPaymentStatus(orderId);
          if (!result.success || result.status !== 'success') throw new Error('Order capture not yet confirmed');
          paymentId = result.gateway_payment_id;
        }
        if (!paymentId) throw new Error('Captured payment ID not yet available');
        await PaymentService.processSuccessfulPayment(payment.id, paymentId, 'razorpay');
      }
      const { error: completeError } = await supabase.from('payment_webhook_events')
        .update({ processing_status: 'completed', processed_at: new Date().toISOString() })
        .eq('gateway', 'razorpay').eq('event_id', eventId);
      if (completeError) throw completeError;
      return NextResponse.json({ success: true });
    } catch (error) {
      await supabase.from('payment_webhook_events').update({ processing_status: 'failed' })
        .eq('gateway', 'razorpay').eq('event_id', eventId);
      throw error;
    }
  } catch (error) {
    console.error('[Razorpay webhook] Processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed; retry required' }, { status: 500 });
  }
}
