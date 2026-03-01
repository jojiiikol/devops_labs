import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import NotesViewPage from './NotesViewPage'
import { renderWithProviders } from '../test/test-utils'
import type { Note } from '../features/notes/notesSlice'

describe('NotesViewPage', () => {
  const baseAuthState = {
    user: { id: 1, username: 'user' },
    accessToken: 'token',
    status: 'idle' as const,
    error: null as string | null,
  }

  it('shows loading text when notes are being loaded', () => {
    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: baseAuthState,
        notes: { items: [], selectedNote: null, status: 'loading', error: null },
      },
    })

    expect(screen.getByText(/Загружаем заметки/i)).toBeInTheDocument()
  })

  it('shows notes and allows clicking card', () => {
    const notes: Note[] = [
      { id: 1, title: 'Title 1', text: 'Body 1', user_id: 1, username: 'user' },
      { id: 2, title: 'Title 2', text: 'Body 2', user_id: 1, username: 'user' },
    ]

    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: baseAuthState,
        notes: { items: notes, selectedNote: null, status: 'succeeded', error: null },
      },
    })

    expect(screen.getByText('Title 1')).toBeInTheDocument()
    const card = screen.getByText('Title 1').closest('.note-card') as HTMLElement
    fireEvent.click(card)
  })

  it('shows admin toggle when user is admin', () => {
    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: { ...baseAuthState, user: { id: 1, username: 'admin' } },
        notes: { items: [], selectedNote: null, status: 'succeeded', error: null },
      },
    })

    const toggleButton = screen.getByRole('button', { name: /Показать только мои/i })
    expect(toggleButton).toBeInTheDocument()

    fireEvent.click(toggleButton)

    expect(screen.getByRole('button', { name: /Показать все \(админ\)/i })).toBeInTheDocument()
  })
})

