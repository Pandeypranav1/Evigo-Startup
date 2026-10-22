import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';

function route(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: (name) => {
      if (name === 'node:crypto') return crypto;
      if (name === 'next/server') return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected import ${name}`);
    },
    process: { env: { PAYMENT_ENV: 'sandbox', RAZORPAY_WEBHOOK_SECRET_SANDBOX: 'synthetic-webhook-secret' } },
    Buffer, console: { log() {}, warn() {}, error() {} },
  });
  return exports.POST;
}
function database(payment, event = null) {
  const writes = [];
  return { writes, from(table) {
    let operation = 'select';
    const query = {
      select() { return query; }, eq() { return query; },
      insert(value) { operation = 'insert'; writes.push({ table, value }); return query; },
      update(value) { operation = 'update'; writes.push({ table, value }); return query; },
      single() { return query; }, maybeSingle() { return query; },
      then(resolve) { return Promise.resolve({ data: operation === 'select' ? (table === 'payments' ? payment : event) : null, error: null }).then(resolve); },
    };
    return query;
  } };
}
const stored = { id: 'internal', user_id: 'owner', gateway: 'razorpay', gateway_order_id: 'order_test', amount: 125, currency: 'INR', status: 'checkout_started' };
const verifyBody = { payment_id: 'internal', gateway_order_id: 'order_test', gateway_payment_id: 'pay_test', signature: 'signature' };
function verifyHarness(user, payment = stored) {
  let dbAccess = 0;
  const verified = [];
  const settled = [];
  const POST = route('../src/app/api/payments/verify/route.ts', {
    '@/lib/server': { getAuthenticatedUser: async () => ({ user }) },
    '@/lib/supabase': { createAdminClient: () => { dbAccess++; return database(payment); } },
    '@/lib/payment/adapters': { createGatewayAdapter: () => ({ verifyPayment: async (args) => { verified.push(args); return { success: true, status: 'success', gateway_payment_id: 'pay_test' }; } }) },
    '@/lib/payment/service': { PaymentService: { processSuccessfulPayment: async (...args) => settled.push(args) } },
  });
  return { POST, verified, settled, dbAccess: () => dbAccess };
}
const verifyRequest = () => new Request('http://local/api/payments/verify', { method: 'POST', body: JSON.stringify(verifyBody) });
test('verify requires authentication before database access', async () => {
  const h = verifyHarness(null);
  assert.equal((await h.POST(verifyRequest())).status, 401);
  assert.equal(h.dbAccess(), 0);
});
test('verify denies another owner even after webhook success', async () => {
  const h = verifyHarness({ id: 'other' }, { ...stored, status: 'success' });
  assert.equal((await h.POST(verifyRequest())).status, 403);
  assert.equal(h.settled.length, 0);
});
test('verify requires a stored order and forwards trusted price', async () => {
  const missing = verifyHarness({ id: 'owner' }, { ...stored, gateway_order_id: null });
  assert.equal((await missing.POST(verifyRequest())).status, 400);
  const h = verifyHarness({ id: 'owner' });
  assert.equal((await h.POST(verifyRequest())).status, 200);
  assert.equal(h.verified[0].amount, 125);
  assert.equal(h.verified[0].currency, 'INR');
  assert.equal(h.settled.length, 1);
});
function webhookHarness({ payment = stored, completed = false, fail = false, event = 'payment.captured' } = {}) {
  const body = JSON.stringify({ event, payload: { payment: { entity: { id: 'pay_test', order_id: 'order_test', amount: 12500, currency: 'INR' } } } });
  const db = database(payment, { payload_hash: crypto.createHash('sha256').update(body).digest('hex'), processing_status: completed ? 'completed' : 'failed' });
  let calls = 0;
  const POST = route('../src/app/api/payments/webhooks/razorpay/route.ts', {
    '@/lib/supabase': { createAdminClient: () => db },
    '@/lib/payment/adapters': { createGatewayAdapter: () => { throw new Error('Not needed'); } },
    '@/lib/payment/service': { PaymentService: { processSuccessfulPayment: async () => { calls++; if (fail) throw new Error('Database unavailable'); } } },
  });
  const request = (signature = crypto.createHmac('sha256', 'synthetic-webhook-secret').update(body).digest('hex')) => new Request('http://local/webhook', { method: 'POST', body, headers: { 'x-razorpay-event-id': 'event_test', 'x-razorpay-signature': signature } });
  return { POST, request, db, calls: () => calls };
}
test('webhook rejects invalid signatures', async () => {
  const h = webhookHarness();
  assert.equal((await h.POST(h.request('invalid'))).status, 401);
  assert.equal(h.calls(), 0);
});
test('failed webhook is retried and completed only after settlement', async () => {
  const h = webhookHarness();
  assert.equal((await h.POST(h.request())).status, 200);
  assert.equal(h.calls(), 1);
  assert.equal(h.db.writes.at(-1).value.processing_status, 'completed');
  const duplicate = webhookHarness({ completed: true });
  assert.equal((await duplicate.POST(duplicate.request())).status, 200);
  assert.equal(duplicate.calls(), 0);
});
test('missing payment, amount mismatch and settlement failure remain retryable', async () => {
  for (const config of [{ payment: null }, { payment: { ...stored, amount: 999 } }, { fail: true }]) {
    const h = webhookHarness(config);
    assert.equal((await h.POST(h.request())).status, 500);
    assert.equal(h.db.writes.at(-1).value.processing_status, 'failed');
  }
});
