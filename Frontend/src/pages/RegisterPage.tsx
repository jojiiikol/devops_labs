import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store'
import { register } from '../features/auth/authSlice'

const RegisterPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error } = useAppSelector((state) => state.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const resultAction = await dispatch(register({ username, password }))
    if (register.fulfilled.match(resultAction)) {
      navigate('/login')
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Регистрация</h1>
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
              autoComplete="new-password"
              required
            />
          </div>
          {error && <div className="helper-text" style={{ color: '#fecaca' }}>{error}</div>}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Создаем...' : 'Создать аккаунт'}
            </button>
            <span className="helper-text">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage

