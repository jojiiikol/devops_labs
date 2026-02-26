import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store'
import { createNote, deleteNote, fetchNoteById, updateNote } from '../features/notes/notesSlice'

const NoteEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((state) => state.auth)
  const { selectedNote, status, error } = useAppSelector((state) => state.notes)

  const isNew = id === 'new'

  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    if (!isNew && id) {
      void dispatch(fetchNoteById({ token: accessToken, id: Number(id) }))
    }
  }, [accessToken, dispatch, id, isNew, navigate])

  useEffect(() => {
    if (!isNew && selectedNote) {
      setTitle(selectedNote.title)
      setText(selectedNote.text)
    }
  }, [isNew, selectedNote])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) return

    if (isNew) {
      const result = await dispatch(createNote({ token: accessToken, title, text }))
      if (createNote.fulfilled.match(result)) {
        navigate('/notes')
      }
    } else if (id) {
      const result = await dispatch(updateNote({ token: accessToken, id: Number(id), title, text }))
      if (updateNote.fulfilled.match(result)) {
        navigate('/notes')
      }
    }
  }

  const handleDelete = async () => {
    if (!accessToken || !id || isNew) return
    const result = await dispatch(deleteNote({ token: accessToken, id: Number(id) }))
    if (deleteNote.fulfilled.match(result)) {
      navigate('/notes')
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">{isNew ? 'Новая заметка' : 'Редактирование заметки'}</h1>
      <div className="form-card">
        {status === 'loading' && !isNew && (
          <div className="helper-text">Загружаем заметку...</div>
        )}
        {error && <div className="helper-text" style={{ color: '#fecaca' }}>{error}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label htmlFor="title">Заголовок</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="text">Текст</label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={status === 'loading'}>
              Сохранить
            </button>
            {!isNew && (
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={status === 'loading'}
              >
                Удалить
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default NoteEditPage

