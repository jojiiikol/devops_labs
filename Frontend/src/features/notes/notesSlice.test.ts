import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import notesReducer, {
  type Note,
  clearSelected,
  createNote,
  deleteNote,
  fetchAllNotes,
  fetchMyNotes,
  fetchNoteById,
  normalizeNote,
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

  it('handles fetchMyNotes pending and resets error', () => {
    const preloaded = { ...baseState, error: 'old' }
    const state = notesReducer(preloaded, fetchMyNotes.pending('id', { token: 't' }))
    expect(state.status).toBe('loading')
    expect(state.error).toBeNull()
  })

  it('handles fetchMyNotes fulfilled', () => {
    const state = notesReducer(baseState, fetchMyNotes.fulfilled(sampleNotes, 'id', { token: 't' }))
    expect(state.status).toBe('succeeded')
    expect(state.items).toEqual(sampleNotes)
  })

  it('handles fetchMyNotes rejected with payload and fallback', () => {
    const withPayload = notesReducer(baseState, fetchMyNotes.rejected(new Error('e'), 'id', { token: 't' }, 'Error'))
    expect(withPayload.status).toBe('failed')
    expect(withPayload.error).toBe('Error')

    const fallback = notesReducer(baseState, fetchMyNotes.rejected(new Error('e'), 'id', { token: 't' }))
    expect(fallback.error).toBe('Ошибка загрузки заметок')
  })

  it('handles fetchAllNotes pending and fulfilled', () => {
    const pendingState = notesReducer(baseState, fetchAllNotes.pending('id', { token: 't' }))
    expect(pendingState.status).toBe('loading')

    const fulfilledState = notesReducer(baseState, fetchAllNotes.fulfilled(sampleNotes, 'id', { token: 't' }))
    expect(fulfilledState.status).toBe('succeeded')
    expect(fulfilledState.items).toEqual(sampleNotes)
  })

  it('handles fetchAllNotes rejected fallback', () => {
    const state = notesReducer(baseState, fetchAllNotes.rejected(new Error('e'), 'id', { token: 't' }))
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Ошибка загрузки всех заметок')
  })

  it('handles fetchNoteById pending and fulfilled', () => {
    const note: Note = { id: 1, title: 'n', text: 't', user_id: 1, username: 'u' }
    const pendingState = notesReducer(baseState, fetchNoteById.pending('id', { token: 't', id: 1 }))
    expect(pendingState.status).toBe('loading')

    const fulfilledState = notesReducer(baseState, fetchNoteById.fulfilled(note, 'id', { token: 't', id: 1 }))
    expect(fulfilledState.status).toBe('succeeded')
    expect(fulfilledState.selectedNote).toEqual(note)
  })

  it('handles fetchNoteById rejected fallback', () => {
    const state = notesReducer(baseState, fetchNoteById.rejected(new Error('e'), 'id', { token: 't', id: 1 }))
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Ошибка загрузки заметки')
  })

  it('handles createNote fulfilled', () => {
    const note: Note = { id: 3, title: 'new', text: 'text', user_id: 1, username: 'u' }
    const state = notesReducer(
      baseState,
      createNote.fulfilled(note, 'id', { token: 't', title: 'new', text: 'text' }),
    )
    expect(state.items).toEqual([note])
  })

  it('handles updateNote fulfilled for matching selected note', () => {
    const existing: Note = { id: 1, title: 'old', text: 'old', user_id: 1, username: 'u' }
    const updated: Note = { ...existing, title: 'updated' }
    const preloaded = { ...baseState, items: [existing], selectedNote: existing }

    const state = notesReducer(
      preloaded,
      updateNote.fulfilled(updated, 'id', { token: 't', id: 1, title: 'updated', text: 'old' }),
    )
    expect(state.items[0]).toEqual(updated)
    expect(state.selectedNote).toEqual(updated)
  })

  it('handles updateNote fulfilled when selected note id differs', () => {
    const existing: Note = { id: 1, title: 'old', text: 'old', user_id: 1 }
    const anotherSelected: Note = { id: 2, title: 'keep', text: 'keep', user_id: 2 }
    const updated: Note = { ...existing, title: 'updated' }
    const preloaded = { ...baseState, items: [existing], selectedNote: anotherSelected }

    const state = notesReducer(
      preloaded,
      updateNote.fulfilled(updated, 'id', { token: 't', id: 1, title: 'updated', text: 'old' }),
    )
    expect(state.items[0]).toEqual(updated)
    expect(state.selectedNote).toEqual(anotherSelected)
  })

  it('handles deleteNote fulfilled for selected and non-selected note', () => {
    const note1: Note = { id: 1, title: '1', text: 't1', user_id: 1, username: 'u1' }
    const note2: Note = { id: 2, title: '2', text: 't2', user_id: 2, username: 'u2' }
    const preloaded = { ...baseState, items: [note1, note2], selectedNote: note1 }

    const deletedSelected = notesReducer(
      preloaded,
      deleteNote.fulfilled(1, 'id', { token: 't', id: 1 }),
    )
    expect(deletedSelected.items).toEqual([note2])
    expect(deletedSelected.selectedNote).toBeNull()

    const keepSelectedState = notesReducer(
      { ...baseState, items: [note1, note2], selectedNote: note2 },
      deleteNote.fulfilled(1, 'id', { token: 't', id: 1 }),
    )
    expect(keepSelectedState.selectedNote).toEqual(note2)
  })
})

describe('normalizeNote', () => {
  it('normalizes standard note object with description', () => {
    const result = normalizeNote({ id: 1, title: 'Test', description: 'Content', user_id: 1 })
    expect(result).toEqual({ id: 1, title: 'Test', text: 'Content', user_id: 1, username: '' })
  })

  it('uses text and content fallbacks', () => {
    expect(normalizeNote({ id: 1, title: 'Test', text: 'A', user_id: 1 }).text).toBe('A')
    expect(normalizeNote({ id: 1, title: 'Test', content: 'B', user_id: 1 }).text).toBe('B')
  })

  it('handles nested user and userId fallback', () => {
    const withUser = normalizeNote({ id: 1, title: 'Test', description: 'Content', user: { id: 5, username: 'u' } })
    expect(withUser.user_id).toBe(5)
    expect(withUser.username).toBe('u')

    const withUserId = normalizeNote({ id: 1, title: 'Test', description: 'Content', userId: 7 })
    expect(withUserId.user_id).toBe(7)
  })

  it('normalizes invalid and edge values', () => {
    expect(() => normalizeNote(null)).toThrow(TypeError)
    expect(() => normalizeNote(undefined)).toThrow(TypeError)
    expect(normalizeNote({ id: 'abc', title: 123, description: null, user_id: Infinity })).toEqual({
      id: 0,
      title: '123',
      text: '',
      user_id: 0,
      username: '',
    })
  })
})

describe('notes thunks', () => {
  type Dispatch = (action: unknown) => unknown

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const getState = () => ({})
  const dispatch: Dispatch = () => undefined

  it('fetchMyNotes fulfilled normalizes list', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [{ id: '1', title: 'T', description: 'D', user: { id: '2', username: 5 } }],
    } as Response)

    const action = await fetchMyNotes({ token: 'token' })(dispatch, getState, undefined)
    expect(action.type).toBe(fetchMyNotes.fulfilled.type)
    expect(action.payload).toEqual([{ id: 1, title: 'T', text: 'D', user_id: 2, username: '5' }])
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/note/me'),
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    )
  })

  it('fetchMyNotes rejected on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const action = await fetchMyNotes({ token: 'token' })(dispatch, getState, undefined)
    expect(action.type).toBe(fetchMyNotes.rejected.type)
    expect(action.payload).toBe('Не удалось загрузить заметки')
  })

  it('fetchAllNotes handles non-array payload', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'not-array' }),
    } as Response)

    const action = await fetchAllNotes({ token: 'token' })(dispatch, getState, undefined)
    expect(action.type).toBe(fetchAllNotes.fulfilled.type)
    expect(action.payload).toEqual([])
  })

  it('fetchAllNotes rejected on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const action = await fetchAllNotes({ token: 'token' })(dispatch, getState, undefined)
    expect(action.type).toBe(fetchAllNotes.rejected.type)
    expect(action.payload).toBe('Не удалось загрузить все заметки')
  })

  it('fetchNoteById fulfilled', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 3, title: 'one', text: 'two', user_id: 4 }),
    } as Response)

    const action = await fetchNoteById({ token: 'token', id: 3 })(dispatch, getState, undefined)
    expect(action.type).toBe(fetchNoteById.fulfilled.type)
    expect(action.payload).toEqual({ id: 3, title: 'one', text: 'two', user_id: 4, username: '' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/note/3'),
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    )
  })

  it('fetchNoteById rejected on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const action = await fetchNoteById({ token: 'token', id: 3 })(dispatch, getState, undefined)
    expect(action.type).toBe(fetchNoteById.rejected.type)
    expect(action.payload).toBe('Не удалось загрузить заметку')
  })

  it('createNote fulfilled and request payload uses description', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 9, title: 'new', description: 'text', user_id: 1 }),
    } as Response)

    const action = await createNote({ token: 'token', title: 'new', text: 'text' })(dispatch, getState, undefined)
    expect(action.type).toBe(createNote.fulfilled.type)
    expect(action.payload).toEqual({ id: 9, title: 'new', text: 'text', user_id: 1, username: '' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/note/'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
        body: JSON.stringify({ title: 'new', description: 'text' }),
      }),
    )
  })

  it('createNote rejected on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const action = await createNote({ token: 'token', title: 'new', text: 'text' })(dispatch, getState, undefined)
    expect(action.type).toBe(createNote.rejected.type)
    expect(action.payload).toBe('Не удалось создать заметку')
  })

  it('updateNote fulfilled and request payload uses description', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, title: 'u', description: 'x', user_id: 1 }),
    } as Response)

    const action = await updateNote({ token: 'token', id: 10, title: 'u', text: 'x' })(dispatch, getState, undefined)
    expect(action.type).toBe(updateNote.fulfilled.type)
    expect(action.payload).toEqual({ id: 10, title: 'u', text: 'x', user_id: 1, username: '' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/note/10'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
        body: JSON.stringify({ title: 'u', description: 'x' }),
      }),
    )
  })

  it('updateNote rejected on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const action = await updateNote({ token: 'token', id: 10, title: 'u', text: 'x' })(dispatch, getState, undefined)
    expect(action.type).toBe(updateNote.rejected.type)
    expect(action.payload).toBe('Не удалось обновить заметку')
  })

  it('deleteNote fulfilled', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    const action = await deleteNote({ token: 'token', id: 11 })(dispatch, getState, undefined)
    expect(action.type).toBe(deleteNote.fulfilled.type)
    expect(action.payload).toBe(11)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/note/11'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer token' },
      }),
    )
  })

  it('deleteNote rejected on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const action = await deleteNote({ token: 'token', id: 11 })(dispatch, getState, undefined)
    expect(action.type).toBe(deleteNote.rejected.type)
    expect(action.payload).toBe('Не удалось удалить заметку')
  })
})
