import { ArrowLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

export function OverlayPage({
  children,
  title,
  description
}: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="size-4" />
            Back to app
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
