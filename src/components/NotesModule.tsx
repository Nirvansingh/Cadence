import React, { useState } from 'react';
import type { NoteItem } from '../types';
import { storage } from '../storage/storageAdapter';
import { playClickSound } from '../utils/sound';
import { 
  Plus, 
  Trash2, 
  Pin, 
  Search,
  Eye,
  Edit3,
  Sigma
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

export const NotesModule: React.FC<NotesModuleProps> = ({ soundEnabled }) => {
  const [notes, setNotes] = useState<NoteItem[]>(() => storage.getNotes());
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [showFormulaBar, setShowFormulaBar] = useState(false);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

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
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: '1px solid var(--border-hairline)'
                  }}
                >
                  {isPreview ? <Edit3 size={13} /> : <Eye size={13} />}
                  <span>{isPreview ? 'Edit' : 'Preview'}</span>
                </button>

                <button
                  onClick={() => handleTogglePin(activeNote.id)}
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
                <div style={{
                  maxWidth: '760px',
                  color: 'var(--text-main)',
                  lineHeight: 1.7,
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit'
                }}>
                  {activeNote.content}
                </div>
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
