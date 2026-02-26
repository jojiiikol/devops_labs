import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store'
import { fetchMe, login } from '../features/auth/authSlice'

const LoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error } = useAppSelector((state) => state.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const resultAction = await dispatch(login({ username, password }))
    if (login.fulfilled.match(resultAction)) {
      await dispatch(fetchMe())
      navigate('/notes')
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Вход</h1>
      <div className="form-card">
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label htmlFor="username">Логин</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="helper-text" style={{ color: '#fecaca' }}>{error}</div>}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Входим...' : 'Войти'}
            </button>
            <span className="helper-text">
              Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage

