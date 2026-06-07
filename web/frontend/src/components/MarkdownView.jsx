// Simple markdown renderer — handles headings, code blocks, paragraphs
export default function MarkdownView({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;
  let inCodeBlock = false;
  let codeContent = '';
  let codeLanguage = '';

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(<pre key={i}><code>{codeContent}</code></pre>);
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line;
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="mb-2 mt-3">{line.slice(4)}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="mb-2 mt-3">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="mb-3">{line.slice(2)}</h2>);
    } else if (line.trim() === '') {
      elements.push(<br key={i} />);
    } else if (line.trim().startsWith('- ')) {
      elements.push(<li key={i} className="text-sm" style={{ marginLeft: 16 }}>{line.trim().slice(2)}</li>);
    } else {
      // Inline code
      const parts = line.split(/(`[^`]+`)/g);
      const children = parts.map((part, j) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={j}>{part.slice(1, -1)}</code>;
        }
        return part;
      });
      elements.push(<p key={i} className="mb-1">{children}</p>);
    }
    i++;
  }

  // Close unclosed code block
  if (inCodeBlock) {
    elements.push(<pre key="final"><code>{codeContent}</code></pre>);
  }

  return <div>{elements}</div>;
}
