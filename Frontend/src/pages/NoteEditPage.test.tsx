import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import NoteEditPage, {
  composeTextFromTitleAndBody,
  splitTitleAndBodyFromText,
} from './NoteEditPage'

describe('splitTitleAndBodyFromText', () => {
  it('splits into title and body based on first line', () => {
    const { title, body } = splitTitleAndBodyFromText('Title\nBody line 1\nBody line 2')
    expect(title).toBe('Title')
    expect(body).toBe('Body line 1\nBody line 2')
  })

  it('handles only title', () => {
    const { title, body } = splitTitleAndBodyFromText('Only title')
    expect(title).toBe('Only title')
    expect(body).toBe('')
  })

  it('normalizes CRLF and trims leading blank body lines', () => {
    const { title, body } = splitTitleAndBodyFromText('Title\r\n\r\nBody')
    expect(title).toBe('Title')
    expect(body).toBe('Body')
  })
})

describe('composeTextFromTitleAndBody', () => {
  it('returns only body when title is empty', () => {
    expect(composeTextFromTitleAndBody('', 'Body')).toBe('Body')
  })

  it('returns only title when body is empty or whitespace', () => {
    expect(composeTextFromTitleAndBody('Title', '')).toBe('Title')
    expect(composeTextFromTitleAndBody('Title', '   ')).toBe('Title')
  })

  it('joins title and body with newline when both are present', () => {
    expect(composeTextFromTitleAndBody('Title', 'Body')).toBe('Title\nBody')
  })
})

describe('NoteEditPage component', () => {
  it('shows validation error when title (first line) is empty', async () => {
    renderWithProviders(<NoteEditPage />, {
      route: '/notes/new',
      routerProps: { initialIndex: 0 },
      preloadedState: {
        auth: { user: { id: 1, username: 'u' }, accessToken: 'token', status: 'idle', error: null },
        notes: { items: [], selectedNote: null, status: 'idle', error: null },
      },
    })

    const textarea = screen.getByLabelText(/Заметка/i)
    fireEvent.change(textarea, { target: { value: '\nBody without title' } })

    const submit = screen.getByRole('button', { name: /Сохранить/i })
    fireEvent.click(submit)

    expect(
      await screen.findByText(
        /Первая строка заметки должна быть заголовком \(не пустой\)\./i,
      ),
    ).toBeInTheDocument()
  })
})

