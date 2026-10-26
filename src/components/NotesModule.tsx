import React, { useState } from 'react';
import type { NoteItem } from '../types';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
import { 
  Plus, 
  Trash2, 
  Pin, 
  Search,
  Eye,
  Edit3,
  Sigma,
  Download,
  Copy,
  Check
} from 'lucide-react';

interface NotesModuleProps {
  soundEnabled: boolean;
}

const STEM_FORMULAS = [
  { label: 'Quadratic Formula', snippet: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$' },
  { label: 'Newton\'s Law', snippet: '$$F = m \\cdot a$$' },
  { label: 'Kinetic Energy', snippet: '$$E_k = \\frac{1}{2}mv^2$$' },
  { label: 'Pythagoras', snippet: '$$a^2 + b^2 = c^2$$' },
  { label: 'Euler\'s Identity', snippet: '$$e^{i\\pi} + 1 = 0$$' },
  { label: 'Calculus Integral', snippet: '$$\\int_{a}^{b} f(x)\\,dx$$' }
];

const MATH_SYMBOLS = ['²', '³', '√', '∑', '∫', '±', 'π', 'θ', 'Δ', 'λ', '∞', '≈', '≠', '≤', '≥'];

// Lightweight Markdown & Math Parser
const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  if (!content.trim()) {
    return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Note is empty.</p>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code_${i}`} style={{
            margin: '12px 0',
            padding: '14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12.5px',
            color: 'var(--emerald)'
          }}>
            <pre style={{ margin: 0 }}>{codeBuffer.join('\n')}</pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Mathematical formula block ($$formula$$)
    if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 4) {
      const formula = line.trim().slice(2, -2);
      elements.push(
        <div key={`math_${i}`} style={{
          margin: '12px 0',
          padding: '12px 18px',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid var(--sky-border)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '14px',
          color: 'var(--sky)'
        }}>
          {formula}
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-pure)', margin: '18px 0 8px' }}>{line.slice(2)}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-pure)', margin: '14px 0 6px' }}>{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--sky)', margin: '12px 0 4px' }}>{line.slice(4)}</h3>);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} style={{
          margin: '10px 0',
          paddingLeft: '14px',
          borderLeft: '3px solid var(--amber)',
          color: 'var(--text-secondary)',
          fontStyle: 'italic'
        }}>
          {line.slice(2)}
        </blockquote>
      );
      continue;
    }

    // Checkbox list
    if (line.startsWith('- [ ] ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
          <div style={{ width: '13px', height: '13px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }} />
          <span>{line.slice(6)}</span>
        </div>
      );
      continue;
    }
    if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
          <div style={{ width: '13px', height: '13px', borderRadius: '3px', border: '1px solid var(--emerald)', backgroundColor: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#090b10', fontSize: '9px' }}>✓</div>
          <span>{line.slice(6)}</span>
        </div>
      );
      continue;
    }

    // Bullet item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
          <span style={{ color: 'var(--sky)' }}>•</span>
          <span>{line.slice(2)}</span>
        </div>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={i} style={{ height: '8px' }} />);
      continue;
    }

    // Markdown Tables (| Header | Header |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [line];
      let nextIdx = i + 1;
      while (nextIdx < lines.length && lines[nextIdx].trim().startsWith('|') && lines[nextIdx].trim().endsWith('|')) {
        tableLines.push(lines[nextIdx]);
        nextIdx++;
      }
      if (tableLines.length >= 2) {
        const headerCells = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
        const isSeparator = tableLines[1].replace(/[-| :]/g, '').length === 0;
        const dataRows = isSeparator ? tableLines.slice(2) : tableLines.slice(1);
        elements.push(
          <div key={`table_${i}`} style={{ overflowX: 'auto', margin: '14px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
                  {headerCells.map((h, hIdx) => (
                    <th key={hIdx} style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--sky)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => {
                  const cells = row.split('|').slice(1, -1).map(c => c.trim());
                  return (
                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>{cell}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        i = nextIdx - 1;
        continue;
      }
    }

    // Normal paragraph
    elements.push(
      <p key={i} style={{ margin: '4px 0', lineHeight: 1.6, color: 'var(--text-main)' }}>
        {line}
      </p>
    );
  }

  return <div style={{ maxWidth: '780px' }}>{elements}</div>;
};

export const NotesModule: React.FC<NotesModuleProps> = ({ soundEnabled }) => {
  const [notes, setNotes] = useState<NoteItem[]>(() => storage.getNotes());
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [showFormulaBar, setShowFormulaBar] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  const handleExportFormat = (format: 'md' | 'txt' | 'html') => {
    if (!activeNote) return;
    let mime = 'text/markdown;charset=utf-8';
    let content = activeNote.content;
    const ext = format;

    if (format === 'txt') {
      mime = 'text/plain;charset=utf-8';
    } else if (format === 'html') {
      mime = 'text/html;charset=utf-8';
      content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${activeNote.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #111; background: #fafafa; }
    h1 { border-bottom: 2px solid #e5e5e5; padding-bottom: 8px; }
    pre { background: #f0f0f2; padding: 14px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 3px solid #f59e0b; margin: 0; padding-left: 12px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #eee; }
  </style>
</head>
<body>
  <h1>${activeNote.title}</h1>
  <div style="white-space: pre-wrap;">${activeNote.content.replace(/</g, '&lt;')}</div>
</body>
</html>`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(activeNote.title || 'untitled').toLowerCase().replace(/\s+/g, '-')}.${ext}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    playSuccessChime(soundEnabled);
  };

  const handleCopyNote = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.content);
    setCopiedNotice(true);
    playClickSound(soundEnabled);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleUpdateContent = (content: string) => {
    if (!activeNote) return;
    const updated = notes.map(n => n.id === activeNote.id ? { ...n, content, updatedAt: Date.now() } : n);
    storage.setNotes(updated);
    setNotes(updated);
  };

  const handleUpdateTitle = (title: string) => {
    if (!activeNote) return;
    const updated = notes.map(n => n.id === activeNote.id ? { ...n, title, updatedAt: Date.now() } : n);
    storage.setNotes(updated);
    setNotes(updated);
  };

  const handleInsertSnippet = (snippet: string) => {
    if (!activeNote) return;
    const newContent = activeNote.content + '\n' + snippet;
    handleUpdateContent(newContent);
    playClickSound(soundEnabled);
  };

  const handleCreateNote = () => {
    const newNote: NoteItem = {
      id: `note_${Date.now()}`,
      title: 'Untitled Note',
      content: '# Summary\n\nWrite definitions, formulas, or homework scratchpad notes here...\n\n- [ ] Example task or review item',
      tags: ['Study'],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updated = [newNote, ...notes];
    storage.setNotes(updated);
    setNotes(updated);
    setActiveNoteId(newNote.id);
    playClickSound(soundEnabled);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    storage.setNotes(updated);
    setNotes(updated);
    if (activeNoteId === id && updated.length > 0) {
      setActiveNoteId(updated[0].id);
    }
    playClickSound(soundEnabled);
  };

  const handleTogglePin = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
    storage.setNotes(updated);
    setNotes(updated);
    playClickSound(soundEnabled);
  };

  const filteredNotes = notes.filter(n => {
    return n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="animate-quiet" style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Sidebar List */}
      <div style={{
        width: '280px',
        borderRight: '1px solid var(--border-hairline)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-pure)', textTransform: 'uppercase' }}>
            Notebook
          </h3>
          <button
            onClick={handleCreateNote}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-pure)',
              fontSize: '11.5px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Plus size={12} />
            <span>New</span>
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-hairline)',
          marginBottom: '14px'
        }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              fontSize: '12px',
              width: '100%',
              backgroundColor: 'transparent',
              outline: 'none',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filteredNotes.map(note => {
            const isSelected = activeNote?.id === note.id;
            return (
              <div
                key={note.id}
                onClick={() => { setActiveNoteId(note.id); playClickSound(soundEnabled); }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: isSelected ? 'var(--bg-subtle)' : 'transparent',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--border-subtle)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isSelected ? 'var(--text-pure)' : 'var(--text-main)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {note.title || 'Untitled'}
                  </span>
                  {note.isPinned && (
                    <Pin size={11} color="var(--accent-sand)" style={{ fill: 'var(--accent-sand)', flexShrink: 0 }} />
                  )}
                </div>
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {note.content.replace(/[#*`_]/g, '').slice(0, 45) || 'No content...'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Note Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-app)' }}>
        {activeNote ? (
          <>
            {/* Top Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 28px',
              borderBottom: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-surface)'
            }}>
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                style={{
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-pure)',
                  width: '50%',
                  backgroundColor: 'transparent',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowFormulaBar(!showFormulaBar)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: showFormulaBar ? 'var(--amber-subtle)' : 'var(--bg-subtle)',
                    color: showFormulaBar ? 'var(--amber)' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: showFormulaBar ? 'var(--amber)' : 'var(--border-hairline)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <Sigma size={13} />
                  <span>Math & Symbols</span>
                </button>

                <button
                  onClick={() => setIsPreview(!isPreview)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: isPreview ? 'var(--emerald-subtle)' : 'var(--bg-subtle)',
                    color: isPreview ? 'var(--emerald)' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: isPreview ? 'var(--emerald-border)' : 'var(--border-hairline)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {isPreview ? <Edit3 size={13} /> : <Eye size={13} />}
                  <span>{isPreview ? 'Edit' : 'Preview'}</span>
                </button>

                <button
                  onClick={handleCopyNote}
                  title="Copy raw markdown to clipboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: copiedNotice ? 'var(--emerald-subtle)' : 'var(--bg-subtle)',
                    color: copiedNotice ? 'var(--emerald)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: '1px solid var(--border-hairline)'
                  }}
                >
                  {copiedNotice ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedNotice ? 'Copied!' : 'Copy'}</span>
                </button>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    title="Export note in Markdown, Plain text, or HTML"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      border: '1px solid var(--border-hairline)'
                    }}
                  >
                    <Download size={13} />
                    <span>Export ▾</span>
                  </button>

                  {showExportMenu && (
                    <div className="animate-pop" style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '6px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      padding: '4px',
                      zIndex: 100,
                      minWidth: '130px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <button
                        onClick={() => handleExportFormat('md')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          border: 'none',
                          background: 'none',
                          borderRadius: '3px',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>Markdown</span>
                        <span className="mono" style={{ fontSize: '10px', color: 'var(--sky)' }}>.md</span>
                      </button>
                      <button
                        onClick={() => handleExportFormat('txt')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          border: 'none',
                          background: 'none',
                          borderRadius: '3px',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>Plain Text</span>
                        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>.txt</span>
                      </button>
                      <button
                        onClick={() => handleExportFormat('html')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          border: 'none',
                          background: 'none',
                          borderRadius: '3px',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>Web HTML</span>
                        <span className="mono" style={{ fontSize: '10px', color: 'var(--amber)' }}>.html</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleTogglePin(activeNote.id)}
                  title={activeNote.isPinned ? 'Unpin note' : 'Pin note'}
                  style={{
                    padding: '6px',
                    borderRadius: 'var(--radius-xs)',
                    color: activeNote.isPinned ? 'var(--accent-sand)' : 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Pin size={13} fill={activeNote.isPinned ? 'var(--accent-sand)' : 'none'} />
                </button>

                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  style={{
                    padding: '6px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-faint)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-clay)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Quick Insert / Formula Bar */}
            {showFormulaBar && (
              <div className="animate-pop" style={{
                padding: '10px 28px',
                backgroundColor: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-hairline)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {/* Math symbols */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Quick Symbols:</span>
                  {MATH_SYMBOLS.map(sym => (
                    <button
                      key={sym}
                      onClick={() => handleInsertSnippet(sym)}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: '3px',
                        border: '1px solid var(--border-hairline)',
                        color: 'var(--sky)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: 'JetBrains Mono'
                      }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>

                {/* STEM Formulas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Formulas:</span>
                  {STEM_FORMULAS.map(item => (
                    <button
                      key={item.label}
                      onClick={() => handleInsertSnippet(item.snippet)}
                      style={{
                        padding: '3px 9px',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--border-hairline)',
                        color: 'var(--amber)',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      + {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note Body */}
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
              {isPreview ? (
                <MarkdownPreview content={activeNote.content} />
              ) : (
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleUpdateContent(e.target.value)}
                  placeholder="Type notes or formulas here..."
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '13.5px',
                    fontFamily: 'JetBrains Mono, monospace',
                    lineHeight: 1.6,
                    resize: 'none',
                    backgroundColor: 'transparent',
                    outline: 'none'
                  }}
                />
              )}
            </div>

            {/* Note Footer Stats Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 28px',
              borderTop: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-surface)',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', gap: '16px' }} className="mono">
                <span>{activeNote.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0} words</span>
                <span>{activeNote.content.length} chars</span>
                <span>~{Math.max(1, Math.ceil((activeNote.content.trim().split(/\s+/).length || 1) / 200))} min read</span>
              </div>
              <span className="mono">
                Updated {new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
            <p style={{ fontSize: '13px' }}>Your notebook is clear and ready.</p>
            <button
              onClick={handleCreateNote}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--text-pure)',
                color: '#090b10',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none'
              }}
            >
              Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
