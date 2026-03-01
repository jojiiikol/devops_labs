import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { configureStore, type PreloadedState } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import authReducer from '../features/auth/authSlice'
import notesReducer from '../features/notes/notesSlice'

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    routerProps,
    preloadedState,
  }: {
    route?: string
    routerProps?: Omit<MemoryRouterProps, 'initialEntries'>
    preloadedState?: PreloadedState<RootState>
  } = {},
) {
  const store = configureStore({
    reducer: { auth: authReducer, notes: notesReducer },
    preloadedState,
  })

  function Wrapper({ children }: { children: ReactElement }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]} {...routerProps}>
          {children}
        </MemoryRouter>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper as any }),
  }
}

