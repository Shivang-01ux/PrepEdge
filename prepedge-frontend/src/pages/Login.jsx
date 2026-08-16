import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../api/authApi'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi(form)
      const userData = {
        username: res.data.username,
        email: res.data.email,
        role: res.data.role,
        college: res.data.college,
        department: res.data.department,
      }
      login(res.data.token, userData)

      // Role-based redirect
      if (res.data.role === 'ROLE_ADMIN') {
        navigate('/app/admin')
      } else if (res.data.role === 'ROLE_FACULTY') {
        navigate('/app/faculty')
      } else {
        navigate('/app/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-primary)',
    border: '1px solid var(--border-hover)', borderRadius: '9px',
    padding: '11px 14px', fontSize: '14px', color: 'var(--text-primary)',
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  }
  const onFocus = e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }
  const onBlur  = e => { e.target.style.borderColor = 'var(--border-hover)'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '500px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(5,150,105,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', padding: '0 20px', animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '12px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', margin: '0 auto 14px',
            boxShadow: '0 0 24px var(--accent-glow)',
          }}>⚡</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Prep<span style={{ color: '#059669' }}>Edge</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            India's Placement Preparation Platform
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
            Sign in to continue — works for Student, Faculty & Admin
          </p>

          {error && (
            <div style={{
              background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '9px', padding: '10px 14px',
              fontSize: '13px', color: 'var(--red)', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '7px', letterSpacing: '0.05em' }}>
                EMAIL ADDRESS
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@college.edu"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '7px', letterSpacing: '0.05em' }}>
                PASSWORD
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'var(--bg-hover)' : 'linear-gradient(135deg, #059669, #047857)',
                color: loading ? 'var(--text-muted)' : 'white',
                border: 'none', borderRadius: '9px',
                padding: '13px', fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 24px var(--accent-glow)',
                transition: 'all 0.2s', marginTop: '4px',
              }}
            >
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Role hint */}
          <div style={{
            marginTop: '20px', padding: '12px 14px',
            background: 'var(--bg-primary)', borderRadius: '8px',
            border: '1px solid var(--border)', fontSize: '12px',
            color: 'var(--text-muted)', lineHeight: '1.6',
          }}>
            <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              All roles use this same login:
            </div>
            <div>🎓 <strong>Students</strong> — register yourself</div>
            <div>👨‍🏫 <strong>Faculty</strong> — credentials from your Admin</div>
            <div>⚙️ <strong>Admin</strong> — <code style={{ fontSize: '11px' }}>admin@prepedge.com</code></div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#34d399', fontWeight: '600', textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  )
}