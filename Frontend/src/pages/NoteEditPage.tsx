import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store'
import { createNote, deleteNote, fetchNoteById, updateNote } from '../features/notes/notesSlice'

function splitTitleAndBodyFromText(raw: string): { title: string; body: string } {
  const normalized = raw.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const title = (lines[0] ?? '').trim()
  const body = lines.slice(1).join('\n').replace(/^\n+/, '')
  return { title, body }
}

function composeTextFromTitleAndBody(title: string, body: string): string {
  const t = title.trim()
  const b = body ?? ''
  if (!t) return b
  if (!b.trim()) return t
  return `${t}\n${b}`
}

const NoteEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((state) => state.auth)
  const { selectedNote, status, error } = useAppSelector((state) => state.notes)

  const isNew = id === 'new'

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    if (!isNew && id) {
      void dispatch(fetchNoteById({ token: accessToken, id: Number(id) }))
    }
  }, [accessToken, dispatch, id, isNew, navigate])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) return

    const rawText = textAreaRef.current?.value ?? ''
    const { title, body } = splitTitleAndBodyFromText(rawText)
    if (!title) {
      setClientError('Первая строка заметки должна быть заголовком (не пустой).')
      return
    }

    if (isNew) {
      const result = await dispatch(createNote({ token: accessToken, title, text: body }))
      if (createNote.fulfilled.match(result)) {
        navigate('/notes')
      }
    } else if (id) {
      const result = await dispatch(updateNote({ token: accessToken, id: Number(id), title, text: body }))
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
        {clientError && <div className="helper-text" style={{ color: '#fecaca' }}>{clientError}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label htmlFor="text">Заметка</label>
            <textarea
              key={isNew ? 'new' : (selectedNote ? String(selectedNote.id) : 'loading')}
              id="text"
              ref={textAreaRef}
              defaultValue={isNew ? '' : (selectedNote ? composeTextFromTitleAndBody(selectedNote.title, selectedNote.text) : '')}
              onChange={() => {
                setClientError(null)
              }}
              required
            />
            <div className="helper-text">Первая строка будет заголовком. Остальное сохранится как текст заметки.</div>
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

