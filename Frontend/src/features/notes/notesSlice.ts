import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface Note {
  id: number
  title: string
  text: string
  user_id: number
}

interface NotesState {
  items: Note[]
  selectedNote: Note | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: NotesState = {
  items: [],
  selectedNote: null,
  status: 'idle',
  error: null,
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

interface WithToken {
  token: string
}

function safeString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v === null || v === undefined) return ''
  return String(v)
}

function safeNumber(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function normalizeNote(raw: unknown): Note {
  const n = raw as Record<string, unknown>
  const user = n.user as Record<string, unknown> | undefined
  return {
    id: safeNumber(n.id),
    title: safeString(n.title),
    text: safeString(n.description ?? n.text ?? n.content),
    user_id: safeNumber(n.user_id ?? n.userId ?? user?.id),
  }
}

export const fetchMyNotes = createAsyncThunk<Note[], WithToken, { rejectValue: string }>(
  'notes/fetchMy',
  async ({ token }, { rejectWithValue }) => {
    const response = await fetch(`${API_BASE}/note/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return rejectWithValue('Не удалось загрузить заметки')
    }

    const data = (await response.json()) as unknown
    return Array.isArray(data) ? data.map(normalizeNote) : []
  },
)

export const fetchAllNotes = createAsyncThunk<Note[], WithToken, { rejectValue: string }>(
  'notes/fetchAll',
  async ({ token }, { rejectWithValue }) => {
    const response = await fetch(`${API_BASE}/note/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return rejectWithValue('Не удалось загрузить все заметки')
    }

    const data = (await response.json()) as unknown
    return Array.isArray(data) ? data.map(normalizeNote) : []
  },
)

export const fetchNoteById = createAsyncThunk<Note, { token: string; id: number }, { rejectValue: string }>(
  'notes/fetchById',
  async ({ token, id }, { rejectWithValue }) => {
    const response = await fetch(`${API_BASE}/note/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return rejectWithValue('Не удалось загрузить заметку')
    }

    const data = (await response.json()) as unknown
    return normalizeNote(data)
  },
)

export const createNote = createAsyncThunk<
  Note,
  { token: string; title: string; text: string },
  { rejectValue: string }
>('notes/create', async ({ token, title, text }, { rejectWithValue }) => {
  const response = await fetch(`${API_BASE}/note/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, description: text }),
  })

  if (!response.ok) {
    return rejectWithValue('Не удалось создать заметку')
  }

  const data = (await response.json()) as unknown
  return normalizeNote(data)
})

export const updateNote = createAsyncThunk<
  Note,
  { token: string; id: number; title: string; text: string },
  { rejectValue: string }
>('notes/update', async ({ token, id, title, text }, { rejectWithValue }) => {
  const response = await fetch(`${API_BASE}/note/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, description: text }),
  })

  if (!response.ok) {
    return rejectWithValue('Не удалось обновить заметку')
  }

  const data = (await response.json()) as unknown
  return normalizeNote(data)
})

export const deleteNote = createAsyncThunk<
  number,
  { token: string; id: number },
  { rejectValue: string }
>('notes/delete', async ({ token, id }, { rejectWithValue }) => {
  const response = await fetch(`${API_BASE}/note/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return rejectWithValue('Не удалось удалить заметку')
  }

  return id
})

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    clearSelected(state) {
      state.selectedNote = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotes.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMyNotes.fulfilled, (state, action: PayloadAction<Note[]>) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchMyNotes.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Ошибка загрузки заметок'
      })
      .addCase(fetchAllNotes.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAllNotes.fulfilled, (state, action: PayloadAction<Note[]>) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchAllNotes.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Ошибка загрузки всех заметок'
      })
      .addCase(fetchNoteById.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchNoteById.fulfilled, (state, action: PayloadAction<Note>) => {
        state.status = 'succeeded'
        state.selectedNote = action.payload
      })
      .addCase(fetchNoteById.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Ошибка загрузки заметки'
      })
      .addCase(createNote.fulfilled, (state, action: PayloadAction<Note>) => {
        state.items.push(action.payload)
      })
      .addCase(updateNote.fulfilled, (state, action: PayloadAction<Note>) => {
        state.items = state.items.map((note) => (note.id === action.payload.id ? action.payload : note))
        if (state.selectedNote?.id === action.payload.id) {
          state.selectedNote = action.payload
        }
      })
      .addCase(deleteNote.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((note) => note.id !== action.payload)
        if (state.selectedNote?.id === action.payload) {
          state.selectedNote = null
        }
      })
  },
})

export const { clearSelected } = notesSlice.actions
export default notesSlice.reducer

