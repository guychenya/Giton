import React, { useState } from 'react';
import Icon from './Icon';

interface CodeBlockProps {
  codeContent: string;
  isDarkMode?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ codeContent, isDarkMode = true }) => {
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
      <pre className={`border p-4 rounded-lg overflow-x-auto pr-16 ${isDarkMode ? 'bg-gray-900/70 border-white/10' : 'bg-gray-100 border-gray-300'}`}>
        <code className={`font-mono text-sm ${isDarkMode ? 'text-pink-300' : 'text-pink-600'}`}>{codeContent}</code>
      </pre>
      <button
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
        className={`absolute top-3 right-3 font-sans text-xs font-bold py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
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
      return <code key={index} className="bg-gray-200 text-pink-600 rounded px-1.5 py-1 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      const [, linkText, href] = linkMatch;
      return <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{linkText}</a>;
    }
    return part;
  });
};

const MarkdownRenderer: React.FC<{ content: string; isDarkMode?: boolean }> = ({ content, isDarkMode = true }) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Headings
        if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className={`text-2xl font-bold mt-6 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{line.substring(2)}</h1>);
            i++; continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className={`text-xl font-semibold mt-5 mb-2 border-b pb-2 ${isDarkMode ? 'text-white border-white/10' : 'text-gray-900 border-gray-300'}`}>{line.substring(3)}</h2>);
            i++; continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className={`text-lg font-semibold mt-4 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{line.substring(4)}</h3>);
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
            elements.push(<CodeBlock key={`code-${i}`} codeContent={codeBlockContent.trim()} isDarkMode={isDarkMode} />);
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
                    {listItems.map((item, index) => <li key={index} className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{parseInlineMarkdown(item)}</li>)}
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
              <div key={`table-${i}`} className={`my-4 overflow-x-auto rounded-lg border ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-gray-300 bg-gray-50'} backdrop-blur-md`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={isDarkMode ? 'bg-white/5' : 'bg-gray-100'}>
                      {headerCells.map((cell, idx) => <th key={idx} className={`p-3 font-semibold text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{parseInlineMarkdown(cell.trim())}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className={`border-t transition-colors duration-200 ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-100'}`}>
                        {row.map((cell, cellIdx) => <td key={cellIdx} className={`p-3 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{parseInlineMarkdown(cell.trim())}</td>)}
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
            elements.push(<p key={i} className={`my-2 leading-relaxed text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{parseInlineMarkdown(line)}</p>);
        }

        i++;
    }

    return <div className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{elements}</div>;
};

export default MarkdownRenderer;