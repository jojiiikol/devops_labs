import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import { useAppDispatch, useAppSelector } from './store'
import { fetchMe, logout } from './features/auth/authSlice'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotesViewPage from './pages/NotesViewPage'
import NoteEditPage from './pages/NoteEditPage'

function App() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { accessToken, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (accessToken && !user) {
      void dispatch(fetchMe())
    }
  }, [accessToken, user, dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

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
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/notes" element={<NotesViewPage />} />
          <Route path="/notes/:id" element={<NoteEditPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
