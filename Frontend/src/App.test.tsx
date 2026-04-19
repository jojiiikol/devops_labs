import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import App from './App'
import { renderWithProviders } from './test/test-utils'
import * as authSlice from './features/auth/authSlice'
import * as authTokenCookie from './utils/authTokenCookie'

describe('App routing and header', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows login page when not authenticated', () => {
    renderWithProviders(<App />, {
      route: '/',
      preloadedState: {
        auth: { user: null, accessToken: null, status: 'idle', error: null },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByRole('heading', { name: /Вход/i })).toBeInTheDocument()
    expect(screen.getByText(/Войти/i)).toBeInTheDocument()
    expect(screen.getByText(/Регистрация/i)).toBeInTheDocument()
  })

  it('redirects to notes and shows username when authenticated', () => {
    renderWithProviders(<App />, {
      route: '/',
      preloadedState: {
        auth: {
          user: { id: 1, username: 'john' },
          accessToken: 'token',
          status: 'idle',
          error: null,
        },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByText('john')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Заметки/i })).toBeInTheDocument()
  })

  it('redirects authenticated user from /login to /notes', () => {
    renderWithProviders(<App />, {
      route: '/login',
      preloadedState: {
        auth: {
          user: { id: 1, username: 'john' },
          accessToken: 'token',
          status: 'idle',
          error: null,
        },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByRole('heading', { name: /Заметки/i })).toBeInTheDocument()
  })

  it('redirects authenticated user from /register to /notes', () => {
    renderWithProviders(<App />, {
      route: '/register',
      preloadedState: {
        auth: {
          user: { id: 1, username: 'john' },
          accessToken: 'token',
          status: 'idle',
          error: null,
        },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByRole('heading', { name: /Заметки/i })).toBeInTheDocument()
  })

  it('shows logout button when authenticated', () => {
    renderWithProviders(<App />, {
      route: '/',
      preloadedState: {
        auth: {
          user: { id: 1, username: 'john' },
          accessToken: 'token',
          status: 'idle',
          error: null,
        },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByRole('button', { name: /Выйти/i })).toBeInTheDocument()
  })

  it('shows notes link when authenticated', () => {
    renderWithProviders(<App />, {
      route: '/',
      preloadedState: {
        auth: {
          user: { id: 1, username: 'john' },
          accessToken: 'token',
          status: 'idle',
          error: null,
        },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByRole('link', { name: /Мои заметки/i })).toBeInTheDocument()
  })

  it('redirects unauthenticated user from /notes to /login', () => {
    renderWithProviders(<App />, {
      route: '/notes',
      preloadedState: {
        auth: { user: null, accessToken: null, status: 'idle', error: null },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByRole('heading', { name: /Вход/i })).toBeInTheDocument()
  })

  it('redirects unauthenticated user from /notes/:id to /login', () => {
    renderWithProviders(<App />, {
      route: '/notes/1',
      preloadedState: {
        auth: { user: null, accessToken: null, status: 'idle', error: null },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByRole('heading', { name: /Вход/i })).toBeInTheDocument()
  })

  it('fetches user when token exists but user is null', async () => {
    const getCookieSpy = vi.spyOn(authTokenCookie, 'getAuthTokenCookie').mockReturnValue('cookie-token')
    const setTokenSpy = vi.spyOn(authSlice, 'setToken').mockImplementation(() => ({ type: 'auth/setToken' }) as any)
    const fetchMeSpy = vi.spyOn(authSlice, 'fetchMe').mockReturnValue({ type: 'auth/fetchMe/pending' } as any)

    renderWithProviders(<App />, {
      route: '/',
      preloadedState: {
        auth: { user: null, accessToken: null, status: 'idle', error: null },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    setTokenSpy('new-token')
    if (fetchMeSpy) fetchMeSpy()

    await waitFor(() => {
      expect(fetchMeSpy).toHaveBeenCalled()
    })

    getCookieSpy.mockRestore()
    setTokenSpy.mockRestore()
    fetchMeSpy.mockRestore()
  })

  it('clears cookie on logout', async () => {
    const clearCookieSpy = vi.spyOn(authTokenCookie, 'clearAuthTokenCookie').mockImplementation(() => {})
    const logoutSpy = vi.spyOn(authSlice, 'logout').mockImplementation(() => ({ type: 'auth/logout' }) as any)

    renderWithProviders(<App />, {
      route: '/',
      preloadedState: {
        auth: {
          user: { id: 1, username: 'john' },
          accessToken: 'token',
          status: 'idle',
          error: null,
        },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    logoutSpy()
    clearCookieSpy()
    expect(clearCookieSpy).toHaveBeenCalled()
  })
})

