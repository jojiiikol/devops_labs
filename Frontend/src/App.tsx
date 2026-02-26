import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import { useAppDispatch, useAppSelector } from './store'
import { fetchMe, logout, setToken } from './features/auth/authSlice'
import { clearAuthTokenCookie, getAuthTokenCookie } from './utils/authTokenCookie'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotesViewPage from './pages/NotesViewPage'
import NoteEditPage from './pages/NoteEditPage'

function App() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { accessToken, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!accessToken) {
      const tokenFromCookie = getAuthTokenCookie()
      if (tokenFromCookie) {
        dispatch(setToken(tokenFromCookie))
      }
    }
  }, [accessToken, dispatch])

  useEffect(() => {
    if (accessToken && !user) {
      void dispatch(fetchMe())
    }
  }, [accessToken, user, dispatch])

  const handleLogout = () => {
    dispatch(logout())
    clearAuthTokenCookie()
    navigate('/login')
  }

  const isAuthenticated = Boolean(accessToken)

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-logo">Notes App</div>
        <nav className="app-nav">
          {user ? (
            <>
              <span className="app-nav-username">{user.username}</span>
              <Link to="/notes">Мои заметки</Link>
              <button onClick={handleLogout} className="btn-secondary">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Вход</Link>
              <Link to="/register">Регистрация</Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/notes" replace /> : <LoginPage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/notes" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/notes" replace /> : <RegisterPage />} />
          <Route path="/notes" element={isAuthenticated ? <NotesViewPage /> : <Navigate to="/login" replace />} />
          <Route path="/notes/:id" element={isAuthenticated ? <NoteEditPage /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
