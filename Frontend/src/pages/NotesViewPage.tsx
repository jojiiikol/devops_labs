import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store'
import { fetchAllNotes, fetchMyNotes, Note } from '../features/notes/notesSlice'

const NotesViewPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { accessToken, user } = useAppSelector((state) => state.auth)
  const { items, status, error } = useAppSelector((state) => state.notes)
  const [isAdminView, setIsAdminView] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    if (user?.is_admin && isAdminView) {
      void dispatch(fetchAllNotes({ token: accessToken }))
    } else {
      void dispatch(fetchMyNotes({ token: accessToken }))
    }
  }, [accessToken, user, isAdminView, dispatch, navigate])

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
          {user?.is_admin && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAdminView((v) => !v)}
            >
              {isAdminView ? 'Показать только мои' : 'Показать все (админ)'}
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
            <div className="note-text">
              {note.text.length > 120 ? `${note.text.slice(0, 120)}...` : note.text}
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

