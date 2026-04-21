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

  it('shows loading state initially', () => {
    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: baseAuthState,
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    expect(screen.getByText(/Загружаем заметки/i)).toBeInTheDocument()
  })

  it('handles null username in note text', () => {
    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: baseAuthState,
        notes: { items: [{ id: 1, title: 'Title', text: null as unknown as string, user_id: 1, username: 'user' }], selectedNote: null, status: 'succeeded', error: null },
      },
    })

    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('handles admin username case insensitively', () => {
    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: { ...baseAuthState, user: { id: 1, username: 'ADMIN' } },
        notes: { items: [], selectedNote: null, status: 'succeeded', error: null },
      },
    })

    expect(screen.getByRole('button', { name: /Показать только мои/i })).toBeInTheDocument()
  })

  it('handles empty username string', () => {
    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: { ...baseAuthState, user: { id: 1, username: '' } },
        notes: { items: [], selectedNote: null, status: 'succeeded', error: null },
      },
    })

    expect(screen.queryByRole('button', { name: /Показать/i })).not.toBeInTheDocument()
  })

  it('shows both title and button for new note', () => {
    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: baseAuthState,
        notes: { items: [], selectedNote: null, status: 'succeeded', error: null },
      },
    })

    expect(screen.getByRole('heading', { name: /Заметки/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Новая заметка/i })).toBeInTheDocument()
  })

  it('shows notes grid when items exist', () => {
    const notes = [{ id: 1, title: 'Note 1', text: 'Text 1', user_id: 1, username: 'user' }]
    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: baseAuthState,
        notes: { items: notes, selectedNote: null, status: 'succeeded', error: null },
      },
    })

    expect(screen.getByText('Note 1')).toBeInTheDocument()
    expect(screen.getByText('Text 1')).toBeInTheDocument()
  })

  it('loads all notes for admin', () => {
    renderWithProviders(<NotesViewPage />, {
      route: '/notes',
      preloadedState: {
        auth: { ...baseAuthState, user: { id: 1, username: 'admin' } },
        notes: { items: [], selectedNote: null, status: 'succeeded', error: null },
      },
    })

    const button = screen.getByRole('button', { name: /Показать только мои/i })
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /Показать все \(админ\)/i })).toBeInTheDocument()
  })
})

