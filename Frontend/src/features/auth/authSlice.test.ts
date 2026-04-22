import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import authReducer, {
  type User,
  fetchMe,
  login,
  logout,
  register,
  setToken,
} from './authSlice'
import { clearAuthTokenCookie, setAuthTokenCookie } from '../../utils/authTokenCookie'

vi.mock('../../utils/authTokenCookie', () => ({
  setAuthTokenCookie: vi.fn(),
  clearAuthTokenCookie: vi.fn(),
}))

describe('authSlice reducers', () => {
  const initialState = authReducer(undefined, { type: 'init' })

  it('has correct initial state', () => {
    expect(initialState).toEqual({
      user: null,
      accessToken: null,
      status: 'idle',
      error: null,
    })
  })

  it('handles setToken', () => {
    const state = authReducer(initialState, setToken('abc'))
    expect(state.accessToken).toBe('abc')
  })

  it('handles logout', () => {
    const preloaded = {
      ...initialState,
      user: { id: 1, username: 'john' } as User,
      accessToken: 'token',
      status: 'succeeded' as const,
      error: 'some error',
    }
    const state = authReducer(preloaded, logout())
    expect(state).toEqual(initialState)
  })
})

describe('authSlice extraReducers', () => {
  const baseState = authReducer(undefined, { type: 'init' })

  it('handles login pending/fulfilled/rejected', () => {
    let state = authReducer(baseState, login.pending('reqId', { username: 'u', password: 'p' }))
    expect(state.status).toBe('loading')
    expect(state.error).toBeNull()

    state = authReducer(
      state,
      login.fulfilled({ access_token: 'token123', token_type: 'bearer' }, 'reqId', {
        username: 'u',
        password: 'p',
      }),
    )
    expect(state.status).toBe('succeeded')
    expect(state.accessToken).toBe('token123')

    state = authReducer(
      state,
      login.rejected(new Error('fail'), 'reqId', { username: 'u', password: 'p' }, 'Ошибка'),
    )
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Ошибка')
  })

  it('handles login rejected with fallback message', () => {
    const state = authReducer(baseState, login.rejected(new Error('fail'), 'reqId', { username: 'u', password: 'p' }))
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Ошибка входа')
  })

  it('handles fetchMe lifecycle', () => {
    const user: User = { id: 1, username: 'john' }

    let state = authReducer(baseState, fetchMe.pending('reqId', undefined))
    expect(state.status).toBe('loading')
    expect(state.error).toBeNull()

    state = authReducer(state, fetchMe.fulfilled(user, 'reqId', undefined))
    expect(state.status).toBe('succeeded')
    expect(state.user).toEqual(user)

    state = authReducer(
      state,
      fetchMe.rejected(new Error('e'), 'reqId', undefined, 'Ошибка пользователя'),
    )
    expect(state.status).toBe('failed')
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.error).toBe('Ошибка пользователя')
  })

  it('handles fetchMe rejected with no payload', () => {
    const user: User = { id: 1, username: 'john' }
    let state = authReducer(baseState, fetchMe.fulfilled(user, 'reqId', undefined))
    state = authReducer(
      state,
      fetchMe.rejected(new Error('e'), 'reqId', undefined),
    )
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Ошибка загрузки пользователя')
  })

  it('handles register lifecycle and fallback message', () => {
    let state = authReducer(baseState, register.pending('reqId', { username: 'u', password: 'p' }))
    expect(state.status).toBe('loading')
    expect(state.error).toBeNull()

    state = authReducer(
      state,
      register.fulfilled({} as unknown, 'reqId', { username: 'u', password: 'p' }),
    )
    expect(state.status).toBe('succeeded')

    state = authReducer(
      state,
      register.rejected(new Error('e'), 'reqId', { username: 'u', password: 'p' }, 'Ошибка'),
    )
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Ошибка')

    const fallback = authReducer(baseState, register.rejected(new Error('e'), 'reqId', { username: 'u', password: 'p' }))
    expect(fallback.error).toBe('Ошибка регистрации')
  })
})

describe('auth thunks', () => {
  type Dispatch = (action: unknown) => unknown
  const dispatch: Dispatch = () => undefined
  const getStateWithToken = () => ({ auth: { accessToken: 'token-1' } })
  const getStateWithoutToken = () => ({ auth: { accessToken: null } })

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('login fulfilled sets auth cookie', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'access-1', token_type: 'bearer' }),
    } as Response)

    const action = await login({ username: 'john', password: 'pass' })(dispatch, () => ({}), undefined)
    expect(action.type).toBe(login.fulfilled.type)
    expect(action.payload).toEqual({ access_token: 'access-1', token_type: 'bearer' })
    expect(setAuthTokenCookie).toHaveBeenCalledWith('access-1')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/token/'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    )
  })

  it('login rejected on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const action = await login({ username: 'john', password: 'bad' })(dispatch, () => ({}), undefined)
    expect(action.type).toBe(login.rejected.type)
    expect(action.payload).toBe('Неверный логин или пароль')
    expect(setAuthTokenCookie).not.toHaveBeenCalled()
  })

  it('fetchMe rejected when token is missing', async () => {
    const action = await fetchMe()(dispatch, getStateWithoutToken, undefined)
    expect(action.type).toBe(fetchMe.rejected.type)
    expect(action.payload).toBe('Нет токена')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fetchMe fulfilled with token', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 7, username: 'john', is_admin: true }),
    } as Response)

    const action = await fetchMe()(dispatch, getStateWithToken, undefined)
    expect(action.type).toBe(fetchMe.fulfilled.type)
    expect(action.payload).toEqual({ id: 7, username: 'john', is_admin: true })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/me'),
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
    )
  })

  it('fetchMe rejected and clears cookie for 401', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 } as Response)

    const action = await fetchMe()(dispatch, getStateWithToken, undefined)
    expect(action.type).toBe(fetchMe.rejected.type)
    expect(action.payload).toBe('Не удалось загрузить данные пользователя')
    expect(clearAuthTokenCookie).toHaveBeenCalledTimes(1)
  })

  it('fetchMe rejected and clears cookie for 403', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403 } as Response)

    const action = await fetchMe()(dispatch, getStateWithToken, undefined)
    expect(action.type).toBe(fetchMe.rejected.type)
    expect(action.payload).toBe('Не удалось загрузить данные пользователя')
    expect(clearAuthTokenCookie).toHaveBeenCalledTimes(1)
  })

  it('fetchMe rejected without clearing cookie for non-auth error', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response)

    const action = await fetchMe()(dispatch, getStateWithToken, undefined)
    expect(action.type).toBe(fetchMe.rejected.type)
    expect(action.payload).toBe('Не удалось загрузить данные пользователя')
    expect(clearAuthTokenCookie).not.toHaveBeenCalled()
  })

  it('register fulfilled', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, username: 'new-user' }),
    } as Response)

    const action = await register({ username: 'new-user', password: 'secret' })(dispatch, () => ({}), undefined)
    expect(action.type).toBe(register.fulfilled.type)
    expect(action.payload).toEqual({ id: 1, username: 'new-user' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'new-user', password: 'secret' }),
      }),
    )
  })

  it('register rejected on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const action = await register({ username: 'new-user', password: 'secret' })(dispatch, () => ({}), undefined)
    expect(action.type).toBe(register.rejected.type)
    expect(action.payload).toBe('Не удалось зарегистрироваться')
  })
})
