import ReactMarkdown from 'react-markdown';

/**
 * "Privacy Policy" used to appear three times before the first sentence: once
 * from the surrounding OverlayPage, once from the `<h1>{title}</h1>` this
 * rendered, and once from the `# Privacy Policy` the markdown file opens with.
 * OverlayPage owns the page title, so drop ours and strip the file's.
 */
function stripLeadingTitle(body: string, title: string) {
  const match = body.match(/^\s*#\s+(.+?)\s*(?:\n|$)/);
  if (!match) {
    return body;
  }

  const heading = match[1]!.trim().toLowerCase();
  if (heading !== title.trim().toLowerCase()) {
    return body;
  }

  return body.slice(match[0].length).replace(/^\s*\n/, '');
}

export function MarkdownPage({ title, body }: { title: string; body: string }) {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:tracking-tight">
      <ReactMarkdown>{stripLeadingTitle(body, title)}</ReactMarkdown>
    </article>
  );
}
