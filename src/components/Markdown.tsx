import type { ReactNode } from 'react';

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|@[A-Za-z]+)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="px-1 py-0.5 rounded bg-elev text-accent text-[0.85em] font-mono">{p.slice(1, -1)}</code>;
    if (/^@[A-Za-z]+$/.test(p)) return <span key={i} className="text-accent font-semibold">{p}</span>;
    return <span key={i}>{p}</span>;
  });
}

export function Md({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: number) => {
    if (list.length) {
      out.push(
        <ul key={`l${key}`} className="list-disc pl-5 my-2 space-y-1">
          {list.map((li, j) => <li key={j}>{inline(li)}</li>)}
        </ul>
      );
      list = [];
    }
  };
  lines.forEach((line, i) => {
    if (line.startsWith('- ')) { list.push(line.slice(2)); return; }
    flush(i);
    if (line.startsWith('## ')) out.push(<h4 key={i} className="font-bold text-[0.95em] mt-3 mb-1">{inline(line.slice(3))}</h4>);
    else if (line.startsWith('# ')) out.push(<h3 key={i} className="font-bold text-[1.05em] mt-3 mb-1">{inline(line.slice(2))}</h3>);
    else if (!line.trim()) out.push(<div key={i} className="h-2" />);
    else out.push(<p key={i} className="leading-relaxed">{inline(line)}</p>);
  });
  flush(9999);
  return <div className={className}>{out}</div>;
}
