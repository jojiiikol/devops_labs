import { describe, expect, it } from 'vitest'
import authReducer, {
  type User,
  fetchMe,
  login,
  logout,
  register,
  setToken,
} from './authSlice'

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

  it('handles register lifecycle', () => {
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
  })
})

