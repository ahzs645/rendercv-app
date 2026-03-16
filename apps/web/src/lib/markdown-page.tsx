import ReactMarkdown from 'react-markdown';

export function MarkdownPage({ title, body }: { title: string; body: string }) {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight">
      <h1>{title}</h1>
      <ReactMarkdown>{body}</ReactMarkdown>
    </article>
  );
}
