import { Hono } from 'hono';
import type { BillingSubscriptionResponse, CheckoutResponse, PortalResponse } from '@rendercv/contracts';
import { serverState } from '../persistence';

export const billingRouter = new Hono()
  .get('/subscription', (context) =>
    context.json<BillingSubscriptionResponse>({
      tier: serverState.billing.tier,
      interval: serverState.billing.interval
    })
  )
  .post('/checkout', async (context) => {
    const body = (await context.req.json().catch(() => ({}))) as { slug?: string };
    return context.json<CheckoutResponse>({
      url: body.slug ? `https://rendercv.example/checkout/${body.slug}` : null,
      productId: body.slug
    });
  })
  .get('/portal', (context) =>
    context.json<PortalResponse>({
      url: 'https://rendercv.example/portal'
    })
  )
  .post('/webhooks/polar', (context) => context.json({ ok: true }));
