import { useState, useEffect, useMemo } from 'react'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function Notepad({ conversationId, onClose }) {
  const [notes, setNotes] = useState([])
  const [expandedNote, setExpandedNote] = useState(null)
  const [editingNote, setEditingNote] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q = query(
      collection(db, 'conversations', conversationId, 'notes'),
      orderBy('time', 'desc'),
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [conversationId])

  const sortedNotes = useMemo(() => {
    const pinned = notes.filter(n => n.pinned)
    const unpinned = notes.filter(n => !n.pinned)
    return [...pinned, ...unpinned]
  }, [notes])

  async function handleDelete(noteId) {
    await deleteDoc(doc(db, 'conversations', conversationId, 'notes', noteId))
  }

  async function handleTogglePin(noteId, currentPinned) {
    await updateDoc(doc(db, 'conversations', conversationId, 'notes', noteId), {
      pinned: !currentPinned,
    })
  }

  async function handleAddNote(e) {
    e.preventDefault()
    const title = newTitle.trim()
    const content = newContent.trim()
    if (!title && !content) return
    setSaving(true)
    await addDoc(collection(db, 'conversations', conversationId, 'notes'), {
      question: title || 'Untitled Note',
      answer: content,
      time: Date.now(),
      pinned: false,
      isUserNote: true,
    })
    setNewTitle('')
    setNewContent('')
    setShowAddForm(false)
    setSaving(false)
  }

  function startEditing(note) {
    setEditingNote(note.id)
    setEditTitle(note.question)
    setEditContent(note.answer)
  }

  async function handleSaveEdit(noteId) {
    setSaving(true)
    await updateDoc(doc(db, 'conversations', conversationId, 'notes', noteId), {
      question: editTitle.trim() || 'Untitled Note',
      answer: editContent,
    })
    setEditingNote(null)
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full bg-amber-50/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/60 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h2 className="font-semibold text-sm text-amber-900">Trip Notepad</h2>
          <span className="text-xs text-amber-600/70">({notes.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowAddForm(!showAddForm); setEditingNote(null) }}
            className={`p-1.5 rounded-lg transition cursor-pointer ${showAddForm ? 'bg-amber-200 text-amber-800' : 'hover:bg-amber-100 text-amber-600'}`}
            title="Add a note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-amber-100 transition cursor-pointer md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {showAddForm && (
          <form onSubmit={handleAddNote} className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-amber-100/60 bg-amber-50/50">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full text-xs font-semibold text-amber-800 bg-transparent focus:outline-none placeholder:text-amber-400"
                autoFocus
              />
            </div>
            <div className="px-3.5 py-2.5">
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Write your note here..."
                rows={4}
                className="w-full text-xs text-text-primary leading-relaxed bg-transparent resize-none focus:outline-none placeholder:text-gray-400"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNewTitle(''); setNewContent('') }}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (!newTitle.trim() && !newContent.trim())}
                  className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-40 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </div>
          </form>
        )}

        {sortedNotes.length === 0 && !showAddForm ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-sm font-medium text-amber-800">No notes yet</p>
            <p className="text-xs text-amber-600/70 mt-1 max-w-[200px]">
              Ask <span className="font-medium text-amber-700">@Gemini</span> a question or tap <span className="font-medium text-amber-700">+</span> to add your own
            </p>
          </div>
        ) : (
          sortedNotes.map(note => {
            const isExpanded = expandedNote === note.id
            const isEditing = editingNote === note.id
            const previewLength = 150
            const contentText = note.answer || ''
            const needsTruncate = contentText.length > previewLength

            if (isEditing) {
              return (
                <div key={note.id} className="bg-white rounded-2xl border-2 border-primary/40 shadow-sm overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-amber-100/60 bg-amber-50/50">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full text-xs font-semibold text-amber-800 bg-transparent focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="px-3.5 py-2.5">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={6}
                      className="w-full text-xs text-text-primary leading-relaxed bg-transparent resize-none focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <button
                        onClick={() => setEditingNote(null)}
                        className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-40 cursor-pointer"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={note.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${note.pinned ? 'border-amber-400 ring-1 ring-amber-200' : 'border-amber-200/60'}`}>
                <div className="px-3.5 py-2.5 border-b border-amber-100/60 bg-amber-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                      {note.pinned && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                      )}
                      <p className="text-xs font-semibold text-amber-800 leading-snug">
                        {note.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleTogglePin(note.id, note.pinned)}
                        className={`p-1 rounded-md transition cursor-pointer ${note.pinned ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'hover:bg-amber-50 text-amber-400'}`}
                        title={note.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill={note.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => startEditing(note)}
                        className="p-1 rounded-md hover:bg-amber-50 transition cursor-pointer"
                        title="Edit note"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-amber-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
                        title="Delete note"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-red-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-amber-500">
                      {new Date(note.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(note.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {note.isUserNote && (
                      <span className="text-[9px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">User note</span>
                    )}
                    {!note.isUserNote && (
                      <span className="text-[9px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Gemini</span>
                    )}
                  </div>
                </div>
                <div className="px-3.5 py-2.5">
                  <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                    {isExpanded || !needsTruncate
                      ? contentText
                      : contentText.slice(0, previewLength) + '...'}
                  </p>
                  {needsTruncate && (
                    <button
                      onClick={() => setExpandedNote(isExpanded ? null : note.id)}
                      className="text-[11px] font-medium text-amber-700 hover:text-amber-900 mt-1.5 cursor-pointer"
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
