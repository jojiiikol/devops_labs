import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store'
import { fetchAllNotes, fetchMyNotes, type Note } from '../features/notes/notesSlice'

const NotesViewPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { accessToken, user } = useAppSelector((state) => state.auth)
  const { items, status, error } = useAppSelector((state) => state.notes)
  const isAdmin = (user?.username ?? '').toLowerCase() === 'admin'
  const [isAdminView, setIsAdminView] = useState<boolean | null>(null)
  const effectiveAdminView = Boolean(isAdmin && (isAdminView ?? true))

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    if (effectiveAdminView) {
      void dispatch(fetchAllNotes({ token: accessToken }))
    } else {
      void dispatch(fetchMyNotes({ token: accessToken }))
    }
  }, [accessToken, effectiveAdminView, dispatch, navigate])

  const handleCardClick = (note: Note) => {
    navigate(`/notes/${note.id}`)
  }

  const handleCreateNew = () => {
    navigate('/notes/new')
  }

  return (
    <div className="page">
      <div className="notes-header">
        <h1 className="page-title">Заметки</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAdmin && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAdminView((v) => !Boolean(v ?? true))}
            >
              {effectiveAdminView ? 'Показать только мои' : 'Показать все (админ)'}
            </button>
          )}
          <button type="button" className="btn-primary" onClick={handleCreateNew}>
            Новая заметка
          </button>
        </div>
      </div>

      {status === 'loading' && <div className="helper-text">Загружаем заметки...</div>}
      {error && <div className="helper-text" style={{ color: '#fecaca' }}>{error}</div>}

      <div className="notes-grid">
        {items.map((note) => (
          <div
            key={note.id}
            className="note-card"
            onClick={() => handleCardClick(note)}
            role="button"
          >
            <div className="note-title">{note.title}</div>
            {effectiveAdminView && (
              <div className="helper-text" style={{ marginTop: '0.25rem' }}>
                Автор: {note.username ?? `user #${note.user_id}`}
              </div>
            )}
            <div className="note-text">
              {(() => {
                const text = note.text ?? ''
                return text.length > 120 ? `${text.slice(0, 120)}...` : text
              })()}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && status === 'succeeded' && (
        <div className="helper-text">Заметок пока нет. Создайте первую.</div>
      )}
    </div>
  )
}

export default NotesViewPage

