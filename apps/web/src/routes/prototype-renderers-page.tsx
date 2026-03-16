import { Helmet } from 'react-helmet-async';
import { SECTION_KEYS } from '@rendercv/contracts';
import { themeLabel } from '@rendercv/core';
import { OverlayPage } from '../ui/overlay-page';

const THEMES = ['classic', 'engineeringclassic', 'engineeringresumes', 'moderncv', 'sb2nov'];

export function PrototypeRenderersPage() {
  return (
    <OverlayPage title="Prototype renderers" description="A React replacement landing spot for experimental renderer work.">
      <Helmet>
        <title>Prototype Renderers | RenderCV</title>
      </Helmet>
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Theme coverage</h2>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {THEMES.map((theme) => (
              <li key={theme} className="rounded-xl bg-muted px-4 py-3 text-sm">
                {themeLabel(theme)}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Section contract</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-sidebar p-4 text-xs">
            {JSON.stringify(SECTION_KEYS, null, 2)}
          </pre>
        </section>
      </div>
    </OverlayPage>
  );
}
