import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: number
  username: string
  is_admin?: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: 'idle',
  error: null,
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const login = createAsyncThunk<
  { access_token: string; token_type: string },
  { username: string; password: string },
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  const body = new URLSearchParams()
  body.append('username', credentials.username)
  body.append('password', credentials.password)

  const response = await fetch(`${API_BASE}/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    return rejectWithValue('Неверный логин или пароль')
  }

  const data = (await response.json()) as { access_token: string; token_type: string }
  return data
})

export const fetchMe = createAsyncThunk<User, void, { state: { auth: AuthState }; rejectValue: string }>(
  'auth/fetchMe',
  async (_arg, { getState, rejectWithValue }) => {
    const token = getState().auth.accessToken
    if (!token) {
      return rejectWithValue('Нет токена')
    }

    const response = await fetch(`${API_BASE}/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return rejectWithValue('Не удалось загрузить данные пользователя')
    }

    const data = (await response.json()) as User
    return data
  },
)

export const register = createAsyncThunk<
  unknown,
  { username: string; password: string },
  { rejectValue: string }
>('auth/register', async (payload, { rejectWithValue }) => {
  const response = await fetch(`${API_BASE}/user/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    return rejectWithValue('Не удалось зарегистрироваться')
  }

  return response.json() as Promise<unknown>
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.accessToken = null
      state.status = 'idle'
      state.error = null
    },
    setToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.accessToken = action.payload.access_token
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Ошибка входа'
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Ошибка загрузки пользователя'
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.status = 'succeeded'
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Ошибка регистрации'
      })
  },
})

export const { logout, setToken } = authSlice.actions
export default authSlice.reducer

