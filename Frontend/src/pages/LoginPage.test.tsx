import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import LoginPage from './LoginPage'
import * as authSlice from '../features/auth/authSlice'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders login form', () => {
    renderWithProviders(<LoginPage />, {
      route: '/login',
      preloadedState: {
        auth: { user: null, accessToken: null, status: 'idle', error: null },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByText(/Вход/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Логин/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Пароль/i)).toBeInTheDocument()
  })

  it('dispatches login and fetchMe on submit success', async () => {
    const loginSpy = vi.spyOn(authSlice, 'login')
    const fetchMeSpy = vi.spyOn(authSlice, 'fetchMe')

    // mock thunks to return fulfilled actions
    loginSpy.mockImplementationOnce(() => {
      return async (dispatch: any) => {
        const action = {
          type: 'auth/login/fulfilled',
          payload: { access_token: 't', token_type: 'bearer' },
        }
        dispatch(action)
        return action
      }
    })

    fetchMeSpy.mockImplementationOnce(() => {
      return async () =>
        ({
          type: 'auth/fetchMe/fulfilled',
          payload: { id: 1, username: 'u' },
        } as const)
    })

    const { store } = renderWithProviders(<LoginPage />, {
      route: '/login',
      preloadedState: {
        auth: { user: null, accessToken: null, status: 'idle', error: null },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    fireEvent.change(screen.getByLabelText(/Логин/i), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText(/Пароль/i), { target: { value: 'pass' } })

    fireEvent.submit(screen.getByRole('button', { name: /Войти/i }))

    await waitFor(() => {
      const actions = store.getState().auth
      expect(loginSpy).toHaveBeenCalled()
      expect(fetchMeSpy).toHaveBeenCalled()
      expect(actions.status).toBeDefined()
    })
  })
})

