import assert from 'node:assert/strict';
import { test } from 'node:test';
import crypto from 'node:crypto';
import { RazorpayAdapter } from '../src/lib/payment/adapters/razorpay-adapter.ts';

process.env.PAYMENT_ENV = 'sandbox';
process.env.RAZORPAY_KEY_ID_SANDBOX = 'rzp_test_synthetic';
process.env.RAZORPAY_KEY_SECRET_SANDBOX = 'synthetic-test-secret';
const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET_SANDBOX)
  .update('order_test|pay_test').digest('hex');
const params = { gateway_order_id: 'order_test', gateway_payment_id: 'pay_test', signature, amount: 125, currency: 'INR' };
function adapter(payment = {}) {
  const instance = new RazorpayAdapter();
  instance.instance = { payments: { fetch: async () => ({ id: 'pay_test', order_id: 'order_test', amount: 12500, currency: 'INR', status: 'captured', ...payment }) } };
  return instance;
}
test('captured payment must match order, amount and currency', async () => {
  assert.equal((await adapter().verifyPayment(params)).status, 'success');
  for (const mismatch of [{ order_id: 'order_other' }, { amount: 1 }, { currency: 'USD' }]) {
    assert.equal((await adapter(mismatch).verifyPayment(params)).success, false);
  }
});
test('missing and forged signatures fail before trusting the payment', async () => {
  for (const invalid of [undefined, '', 'x'.repeat(64), '💳'.repeat(32)]) {
    assert.equal((await adapter().verifyPayment({ ...params, signature: invalid })).success, false);
  }
});
test('authorization is pending, not captured', async () => {
  assert.equal((await adapter({ status: 'authorized' }).verifyPayment(params)).status, 'pending');
});
test('paid order returns captured payment ID, never the receipt', async () => {
  const instance = adapter();
  instance.instance.orders = {
    fetch: async () => ({ status: 'paid', receipt: 'booking_id', amount: 12500, amount_paid: 12500 }),
    fetchPayments: async () => ({ items: [{ id: 'pay_failed', status: 'failed' }, { id: 'pay_captured', status: 'captured' }] }),
  };
  const result = await instance.getPaymentStatus('order_test');
  assert.equal(result.gateway_payment_id, 'pay_captured');
  assert.equal(result.paid_amount, 125);
});
test('webhook signatures fail closed without a configured secret', () => {
  delete process.env.RAZORPAY_WEBHOOK_SECRET_SANDBOX;
  assert.equal(adapter().verifyWebhookSignature('{}', crypto.createHmac('sha256', '').update('{}').digest('hex')), false);
});
