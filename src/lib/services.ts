/**
 * Mocked integration layer.
 *
 * These stand in for the real SCR stack — Shopify POS (order creation),
 * Stripe (card holds on file), Synder → QuickBooks Online (ledger sync),
 * and GoHighLevel workflows (SMS receipts). Each returns a realistic
 * reference so the audit trail reads like the production flow.
 */

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  return h;
}

const money = (n: number) => n.toFixed(2);

export async function createShopifyOrder(orderId: string, total: number) {
  await sleep(600);
  return {
    ok: true,
    reference: `gid://shopify/Order/${Math.abs(hash(orderId))}`,
    message: `Shopify POS order created for ${orderId} — $${money(total)}`,
  };
}

export async function authorizeCardHold(orderId: string, last4: string, amount: number) {
  await sleep(800);
  return {
    ok: true,
    reference: `pi_${Math.abs(hash(orderId + last4)).toString(36)}`,
    message: `Card •••• ${last4} hold authorized — $${money(amount)}`,
  };
}

export async function postQboInvoice(orderId: string, total: number) {
  await sleep(1200);
  return {
    ok: true,
    reference: `INV-${2200 + (Math.abs(hash(orderId)) % 99)}`,
    message: `QBO invoice posted via Synder — $${money(total)}`,
  };
}

export async function sendSmsReceipt(customerName: string, orderId: string, total: number) {
  await sleep(700);
  return {
    ok: true,
    reference: `ghl_msg_${Math.abs(hash(customerName + orderId)).toString(36)}`,
    message: `GHL SMS receipt queued for ${customerName} — order ${orderId} ($${money(total)})`,
  };
}
