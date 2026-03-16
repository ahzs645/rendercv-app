import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import type { BillingSubscriptionResponse } from '@rendercv/contracts';
import { api } from '../lib/api';
import { OverlayPage } from '../ui/overlay-page';

const PLANS = [
  { slug: 'plus-monthly', name: 'Plus', description: 'Cloud sync, public links, and more edits.' },
  { slug: 'pro-monthly', name: 'Pro', description: 'AI-heavy workflows and premium automation.' }
] as const;

export function PricingPage() {
  const [billing, setBilling] = useState<BillingSubscriptionResponse | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  useEffect(() => {
    api.getBillingSubscription().then(setBilling).catch(() => {});
  }, []);

  return (
    <OverlayPage title="Pricing" description="Pick a plan for cloud sync, sharing, and AI-powered editing.">
      <Helmet>
        <title>Pricing | RenderCV</title>
      </Helmet>
      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((plan) => (
          <section key={plan.slug} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Current tier: {billing?.tier ?? 'free'}
            </p>
            <button
              className="mt-6 rounded-xl bg-primary px-4 py-2 text-primary-foreground"
              disabled={pendingSlug === plan.slug}
              onClick={async () => {
                setPendingSlug(plan.slug);
                try {
                  const checkout = await api.checkout(plan.slug);
                  if (checkout.url) {
                    window.location.href = checkout.url;
                  }
                } finally {
                  setPendingSlug(null);
                }
              }}
            >
              {pendingSlug === plan.slug ? 'Redirecting…' : `Choose ${plan.name}`}
            </button>
          </section>
        ))}
      </div>
    </OverlayPage>
  );
}
