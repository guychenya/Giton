import React, { useState } from 'react';
import Icon from './Icon';

interface CodeBlockProps {
  codeContent: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ codeContent }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(codeContent).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }, (err) => {
        console.error('Could not copy text: ', err);
      });
    }
  };

  return (
    <div className="relative group my-4">
      <pre className="bg-gray-900/70 border border-white/10 p-4 rounded-lg overflow-x-auto pr-16">
        <code className="font-mono text-sm text-pink-300">{codeContent}</code>
      </pre>
      <button
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
        className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-gray-300 font-sans text-xs font-bold py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        {copied ? (
          <>
            <Icon icon="check" className="w-4 h-4 text-green-400" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Icon icon="copy" className="w-4 h-4" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
};

const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  const regex = /(\*\*.*?\*\*|\*.*?\*|_.*?_|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  return parts.filter(part => part).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="bg-gray-900/80 text-pink-300 rounded px-1.5 py-1 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      const [, linkText, href] = linkMatch;
      return <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{linkText}</a>;
    }
    return part;
  });
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Headings
        if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-2">{line.substring(2)}</h1>);
            i++; continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-xl font-semibold mt-5 mb-2 border-b border-white/10 pb-2">{line.substring(3)}</h2>);
            i++; continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>);
            i++; continue;
        }

        // Code Blocks
        if (line.startsWith('```')) {
            let codeBlockContent = '';
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeBlockContent += lines[i] + '\n';
                i++;
            }
            elements.push(<CodeBlock key={`code-${i}`} codeContent={codeBlockContent.trim()} />);
            i++; continue;
        }
        
        // Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
            const listItems = [];
            while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
                listItems.push(lines[i].substring(2));
                i++;
            }
            elements.push(
                <ul key={`list-${i}`} className="list-disc pl-6 space-y-2 my-4">
                    {listItems.map((item, index) => <li key={index} className="text-base leading-relaxed">{parseInlineMarkdown(item)}</li>)}
                </ul>
            );
            continue;
        }
        
        // Tables
        const isTableSeparator = (l: string) => /^\s*\|?.*\|.*\s*$/.test(l) && /^\s*\|?[-: ]+[-|: ]*\|?/.test(l);
        const isTableLine = (l: string) => l.trim().startsWith('|') && l.trim().endsWith('|');
        const nextLine = lines[i + 1];

        if (isTableLine(line) && nextLine && isTableSeparator(nextLine)) {
            const headerCells = line.trim().slice(1, -1).split('|');
            const bodyRows = [];
            i += 2; // Move past header and separator
            
            while (i < lines.length && isTableLine(lines[i])) {
                const bodyCells = lines[i].trim().slice(1, -1).split('|');
                if (bodyCells.length === headerCells.length) {
                    bodyRows.push(bodyCells);
                } else {
                    break; // Malformed table row, break out
                }
                i++;
            }
            
            elements.push(
              <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-lg border border-white/10 bg-black/20 backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      {headerCells.map((cell, idx) => <th key={idx} className="p-3 font-semibold text-base text-gray-100">{parseInlineMarkdown(cell.trim())}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-t border-white/10 hover:bg-white/5 transition-colors duration-200">
                        {row.map((cell, cellIdx) => <td key={cellIdx} className="p-3 text-base text-gray-300">{parseInlineMarkdown(cell.trim())}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
        }

        // HR
        if (line.trim() === '---') {
            elements.push(<hr key={i} className="my-6 border-white/10" />);
            i++; continue;
        }
        
        // Paragraphs
        if (line.trim() !== '') {
            elements.push(<p key={i} className="my-2 leading-relaxed text-base">{parseInlineMarkdown(line)}</p>);
        }

        i++;
    }

    return <div className="text-base leading-relaxed">{elements}</div>;
};

export default MarkdownRenderer;