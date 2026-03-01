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

  it('handles fetchMyNotes lifecycle', () => {
    let state = notesReducer(baseState, fetchMyNotes.pending('id', { token: 't' }))
    expect(state.status).toBe('loading')
    expect(state.error).toBeNull()

    state = notesReducer(state, fetchMyNotes.fulfilled(sampleNotes, 'id', { token: 't' }))
    expect(state.status).toBe('succeeded')
    expect(state.items).toEqual(sampleNotes)

    state = notesReducer(
      state,
      fetchMyNotes.rejected(new Error('e'), 'id', { token: 't' }, 'Ошибка'),
    )
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Ошибка')
  })

  it('handles fetchAllNotes lifecycle', () => {
    let state = notesReducer(baseState, fetchAllNotes.pending('id', { token: 't' }))
    expect(state.status).toBe('loading')
    expect(state.error).toBeNull()

    state = notesReducer(state, fetchAllNotes.fulfilled(sampleNotes, 'id', { token: 't' }))
    expect(state.status).toBe('succeeded')
    expect(state.items).toEqual(sampleNotes)

    state = notesReducer(
      state,
      fetchAllNotes.rejected(new Error('e'), 'id', { token: 't' }, 'Ошибка'),
    )
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Ошибка')
  })

  it('handles fetchNoteById lifecycle', () => {
    const note: Note = { id: 1, title: 'n', text: 't', user_id: 1, username: 'u' }

    let state = notesReducer(baseState, fetchNoteById.pending('id', { token: 't', id: 1 }))
    expect(state.status).toBe('loading')
    expect(state.error).toBeNull()

    state = notesReducer(
      state,
      fetchNoteById.fulfilled(note, 'id', { token: 't', id: 1 }),
    )
    expect(state.status).toBe('succeeded')
    expect(state.selectedNote).toEqual(note)

    state = notesReducer(
      state,
      fetchNoteById.rejected(new Error('e'), 'id', { token: 't', id: 1 }, 'Ошибка'),
    )
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Ошибка')
  })

  it('handles createNote fulfilled', () => {
    const note: Note = { id: 3, title: 'new', text: 'text', user_id: 1, username: 'u' }
    const state = notesReducer(
      baseState,
      createNote.fulfilled(note, 'id', { token: 't', title: 'new', text: 'text' }),
    )
    expect(state.items).toEqual([note])
  })

  it('handles updateNote fulfilled (updates list and selected)', () => {
    const existing: Note = { id: 1, title: 'old', text: 'old', user_id: 1, username: 'u' }
    const updated: Note = { ...existing, title: 'updated' }
    const preloaded = {
      ...baseState,
      items: [existing],
      selectedNote: existing,
    }

    const state = notesReducer(
      preloaded,
      updateNote.fulfilled(updated, 'id', { token: 't', id: 1, title: 'updated', text: 'old' }),
    )

    expect(state.items[0]).toEqual(updated)
    expect(state.selectedNote).toEqual(updated)
  })

  it('handles deleteNote fulfilled (removes from list and clears selected when matching)', () => {
    const note1: Note = { id: 1, title: '1', text: 't1', user_id: 1, username: 'u1' }
    const note2: Note = { id: 2, title: '2', text: 't2', user_id: 2, username: 'u2' }
    const preloaded = {
      ...baseState,
      items: [note1, note2],
      selectedNote: note1,
    }

    const state = notesReducer(
      preloaded,
      deleteNote.fulfilled(1, 'id', { token: 't', id: 1 }),
    )

    expect(state.items).toEqual([note2])
    expect(state.selectedNote).toBeNull()
  })
})

