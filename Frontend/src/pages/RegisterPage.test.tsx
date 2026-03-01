import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import RegisterPage from './RegisterPage'
import * as authSlice from '../features/auth/authSlice'

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders registration form', () => {
    renderWithProviders(<RegisterPage />, {
      route: '/register',
      preloadedState: {
        auth: { user: null, accessToken: null, status: 'idle', error: null },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByText(/Регистрация/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Логин/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Пароль/i)).toBeInTheDocument()
  })

  it('dispatches register on submit', async () => {
    const registerSpy = vi.spyOn(authSlice, 'register')
    registerSpy.mockReturnValueOnce(async () => ({ type: 'auth/register/fulfilled' }) as any)

    renderWithProviders(<RegisterPage />, {
      route: '/register',
      preloadedState: {
        auth: { user: null, accessToken: null, status: 'idle', error: null },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    fireEvent.change(screen.getByLabelText(/Логин/i), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText(/Пароль/i), { target: { value: 'pass' } })

    fireEvent.submit(screen.getByRole('button', { name: /Создать аккаунт/i }))

    expect(registerSpy).toHaveBeenCalled()
  })
})

