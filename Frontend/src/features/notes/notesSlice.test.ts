import { describe, expect, it } from 'vitest'
import notesReducer, {
  type Note,
  clearSelected,
  createNote,
  deleteNote,
  fetchAllNotes,
  fetchMyNotes,
  fetchNoteById,
  updateNote,
} from './notesSlice'

describe('notesSlice reducers', () => {
  const initialState = notesReducer(undefined, { type: 'init' })

  it('has correct initial state', () => {
    expect(initialState).toEqual({
      items: [],
      selectedNote: null,
      status: 'idle',
      error: null,
    })
  })

  it('handles clearSelected', () => {
    const preloaded = {
      ...initialState,
      selectedNote: { id: 1, title: 't', text: 'b', user_id: 1 } as Note,
    }
    const state = notesReducer(preloaded, clearSelected())
    expect(state.selectedNote).toBeNull()
  })
})

describe('notesSlice extraReducers', () => {
  const baseState = notesReducer(undefined, { type: 'init' })
  const sampleNotes: Note[] = [
    { id: 1, title: 'note1', text: 'text1', user_id: 1, username: 'u1' },
    { id: 2, title: 'note2', text: 'text2', user_id: 2, username: 'u2' },
  ]

  it('handles fetchMyNotes pending', () => {
    let state = notesReducer(baseState, fetchMyNotes.pending('id', { token: 't' }))
    expect(state.status).toBe('loading')
  })

  it('handles fetchMyNotes fulfilled', () => {
    let state = notesReducer(baseState, fetchMyNotes.fulfilled(sampleNotes, 'id', { token: 't' }))
    expect(state.status).toBe('succeeded')
    expect(state.items).toEqual(sampleNotes)
  })

  it('handles fetchMyNotes rejected', () => {
    let state = notesReducer(baseState, fetchMyNotes.rejected(new Error('e'), 'id', { token: 't' }, 'Error'))
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Error')
  })

  it('handles fetchAllNotes pending', () => {
    let state = notesReducer(baseState, fetchAllNotes.pending('id', { token: 't' }))
    expect(state.status).toBe('loading')
  })

  it('handles fetchAllNotes fulfilled', () => {
    let state = notesReducer(baseState, fetchAllNotes.fulfilled(sampleNotes, 'id', { token: 't' }))
    expect(state.status).toBe('succeeded')
    expect(state.items).toEqual(sampleNotes)
  })

  it('handles fetchAllNotes rejected', () => {
    let state = notesReducer(baseState, fetchAllNotes.rejected(new Error('e'), 'id', { token: 't' }, 'Error'))
    expect(state.status).toBe('failed')
  })

  it('handles fetchNoteById pending', () => {
    let state = notesReducer(baseState, fetchNoteById.pending('id', { token: 't', id: 1 }))
    expect(state.status).toBe('loading')
  })

  it('handles fetchNoteById fulfilled', () => {
    const note: Note = { id: 1, title: 'n', text: 't', user_id: 1, username: 'u' }
    let state = notesReducer(baseState, fetchNoteById.fulfilled(note, 'id', { token: 't', id: 1 }))
    expect(state.status).toBe('succeeded')
    expect(state.selectedNote).toEqual(note)
  })

  it('handles fetchNoteById rejected', () => {
    let state = notesReducer(baseState, fetchNoteById.rejected(new Error('e'), 'id', { token: 't', id: 1 }, 'Error'))
    expect(state.status).toBe('failed')
  })

  it('handles createNote fulfilled', () => {
    const note: Note = { id: 3, title: 'new', text: 'text', user_id: 1, username: 'u' }
    const state = notesReducer(
      baseState,
      createNote.fulfilled(note, 'id', { token: 't', title: 'new', text: 'text' }),
    )
    expect(state.items).toEqual([note])
  })

  it('handles updateNote fulfilled', () => {
    const existing: Note = { id: 1, title: 'old', text: 'old', user_id: 1, username: 'u' }
    const updated: Note = { ...existing, title: 'updated' }
    const preloaded = { ...baseState, items: [existing], selectedNote: existing }

    const state = notesReducer(
      preloaded,
      updateNote.fulfilled(updated, 'id', { token: 't', id: 1, title: 'updated', text: 'old' }),
    )
    expect(state.items[0]).toEqual(updated)
  })

  it('handles deleteNote fulfilled', () => {
    const note1: Note = { id: 1, title: '1', text: 't1', user_id: 1, username: 'u1' }
    const note2: Note = { id: 2, title: '2', text: 't2', user_id: 2, username: 'u2' }
    const preloaded = { ...baseState, items: [note1, note2], selectedNote: note1 }

    const state = notesReducer(
      preloaded,
      deleteNote.fulfilled(1, 'id', { token: 't', id: 1 }),
    )
    expect(state.items).toEqual([note2])
  })
})

const normalizeNote = (raw: unknown) => {
  if (raw === null || raw === undefined) {
    return { id: 0, title: '', text: '', user_id: 0, username: '' }
  }
  const safeString = (v: unknown): string => {
    if (typeof v === 'string') return v
    if (v === null || v === undefined) return ''
    return String(v)
  }
  const safeNumber = (v: unknown): number => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const n = raw as Record<string, unknown>
  const user = n.user as Record<string, unknown> | undefined
  return {
    id: safeNumber(n.id),
    title: safeString(n.title),
    text: safeString(n.description ?? n.text ?? n.content),
    user_id: safeNumber(n.user_id ?? n.userId ?? user?.id),
    username: safeString(user?.username),
  }
}

describe('normalizeNote', () => {
  it('normalizes standard note object', () => {
    const result = normalizeNote({ id: 1, title: 'Test', description: 'Content', user_id: 1 })
    expect(result).toEqual({ id: 1, title: 'Test', text: 'Content', user_id: 1, username: '' })
  })

  it('handles text field', () => {
    const result = normalizeNote({ id: 1, title: 'Test', text: 'Content', user_id: 1 })
    expect(result.text).toBe('Content')
  })

  it('handles content field', () => {
    const result = normalizeNote({ id: 1, title: 'Test', content: 'Content', user_id: 1 })
    expect(result.text).toBe('Content')
  })

  it('handles nested user', () => {
    const result = normalizeNote({ id: 1, title: 'Test', description: 'Content', user: { id: 5, username: 'user' } })
    expect(result.user_id).toBe(5)
    expect(result.username).toBe('user')
  })

  it('handles userId field', () => {
    const result = normalizeNote({ id: 1, title: 'Test', description: 'Content', userId: 7 })
    expect(result.user_id).toBe(7)
  })

  it('handles null values', () => {
    const result = normalizeNote(null)
    expect(result.id).toBe(0)
    expect(result.title).toBe('')
  })

  it('handles undefined values', () => {
    const result = normalizeNote(undefined)
    expect(result.id).toBe(0)
  })

  it('handles non-string title', () => {
    const result = normalizeNote({ id: 1, title: 123 as unknown, description: 'Content', user_id: 1 })
    expect(result.title).toBe('123')
  })

  it('handles non-number id', () => {
    const result = normalizeNote({ id: 'abc' as unknown, title: 'Test', description: 'Content', user_id: 1 })
    expect(result.id).toBe(0)
  })

  it('handles Infinity values', () => {
    const result = normalizeNote({ id: Infinity, title: 'Test', description: 'Content', user_id: Infinity })
    expect(result.id).toBe(0)
    expect(result.user_id).toBe(0)
  })

  it('handles empty object', () => {
    const result = normalizeNote({})
    expect(result.id).toBe(0)
    expect(result.title).toBe('')
  })
})