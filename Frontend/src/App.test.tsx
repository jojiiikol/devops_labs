import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import App from './App'
import { renderWithProviders } from './test/test-utils'

describe('App routing and header', () => {
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
})

