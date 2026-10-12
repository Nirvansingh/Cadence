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
  Edit3
} from 'lucide-react';

interface NotesModuleProps {
  soundEnabled: boolean;
}

export const NotesModule: React.FC<NotesModuleProps> = ({ soundEnabled }) => {
  const [notes, setNotes] = useState<NoteItem[]>(() => storage.getNotes());
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreview, setIsPreview] = useState(false);

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

  const handleCreateNote = () => {
    const newNote: NoteItem = {
      id: `note_${Date.now()}`,
      title: 'Untitled Note',
      content: '# Summary\n\nWrite definitions, formulas, or notes here...',
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
              gap: '4px'
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
              width: '100%'
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
                    fontWeight: isSelected ? 500 : 400,
                    color: isSelected ? 'var(--text-pure)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px'
                  }}>
                    {note.title}
                  </span>
                  {note.isPinned && <Pin size={11} color="var(--accent-sand)" />}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {note.tags.map((t, idx) => (
                    <span key={idx} style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)'
                    }} className="mono">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-app)' }}>
        {activeNote ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 28px',
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
                  width: '60%'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    fontSize: '12px'
                  }}
                >
                  {isPreview ? <Edit3 size={13} /> : <Eye size={13} />}
                  <span>{isPreview ? 'Edit' : 'Preview'}</span>
                </button>

                <button
                  onClick={() => handleTogglePin(activeNote.id)}
                  style={{
                    padding: '5px',
                    borderRadius: 'var(--radius-xs)',
                    color: activeNote.isPinned ? 'var(--accent-sand)' : 'var(--text-muted)'
                  }}
                >
                  <Pin size={13} />
                </button>

                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  style={{
                    padding: '5px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-faint)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-clay)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
              {isPreview ? (
                <div style={{
                  maxWidth: '740px',
                  color: 'var(--text-main)',
                  lineHeight: 1.7,
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {activeNote.content}
                </div>
              ) : (
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleUpdateContent(e.target.value)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '13.5px',
                    fontFamily: 'JetBrains Mono',
                    lineHeight: 1.6,
                    resize: 'none'
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
                fontWeight: 600
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
