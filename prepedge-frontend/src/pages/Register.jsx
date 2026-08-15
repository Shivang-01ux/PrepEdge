import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as registerApi } from '../api/authApi'

const COLLEGES = [
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'NIT Trichy', 'NIT Warangal', 'NIT Surathkal', 'BITS Pilani', 'BITS Goa',
  'VIT Vellore', 'VIT Chennai', 'SRM Chennai', 'Manipal MIT', 'IIIT Hyderabad',
  'DTU Delhi', 'NSIT Delhi', 'COEP Pune', 'Jadavpur University', 'Anna University',
  'Amity University', 'Chandigarh University', 'LPU', 'Thapar University', 'Other'
]

const DEPARTMENTS = [
  'CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil',
  'Chemical', 'Biotechnology', 'Data Science', 'AI/ML', 'Other'
]

const checkPasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: '', color: 'transparent', width: '0%' }
  let score = 0
  if (pass.length >= 6) score += 1
  if (pass.length >= 8) score += 1
  if (/[0-9]/.test(pass)) score += 1
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
  if (/[^A-Za-z0-9]/.test(pass)) score += 1
  if (pass.length < 6) return { score: 0, label: 'Too Short (Min 6 characters)', color: '#ef4444', width: '20%' }
  if (score <= 2) return { score: 1, label: 'Weak', color: '#ef4444', width: '40%' }
  if (score <= 4) return { score: 2, label: 'Medium', color: '#f59e0b', width: '70%' }
  return { score: 3, label: 'Strong', color: '#10b981', width: '100%' }
}

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', college: '', department: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const pwStrength = checkPasswordStrength(form.password)

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await registerApi({
        username: form.username,
        email: form.email,
        password: form.password,
        college: form.college,
        department: form.department,
      })
      login(res.data.token, {
        username: res.data.username,
        email: res.data.email,
        role: res.data.role,
        college: res.data.college,
        department: res.data.department,
      })
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-primary)',
    border: '1px solid var(--border-hover)', borderRadius: '9px',
    padding: '11px 14px', fontSize: '14px', color: 'var(--text-primary)',
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: '600',
    color: 'var(--text-secondary)', marginBottom: '7px', letterSpacing: '0.05em',
  }
  const onFocus = e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }
  const onBlur  = e => { e.target.style.borderColor = 'var(--border-hover)'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '24px 0',
    }}>
      <div style={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(5,150,105,0.07), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '440px', padding: '0 20px', animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            Start your placement journey today
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Create your account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
            Free forever · No credit card required
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Username */}
            <div>
              <label style={labelStyle}>FULL NAME</label>
              <input
                id="register-username"
                type="text"
                placeholder="Shivang Thakur"
                value={form.username}
                onChange={e => handleChange('username', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                style={inputStyle}
                required minLength={3}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <input
                id="register-email"
                type="email"
                placeholder="you@college.edu"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                style={inputStyle}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>PASSWORD</label>
              <input
                id="register-password"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                style={inputStyle}
                required minLength={6}
              />
              {form.password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    height: '4px', borderRadius: '4px', background: 'var(--bg-hover)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: pwStrength.width, height: '100%',
                      background: pwStrength.color, transition: 'width 0.3s, background 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: pwStrength.color, marginTop: '4px' }}>
                    {pwStrength.label}
                  </div>
                </div>
              )}
            </div>

            {/* College + Department row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>COLLEGE</label>
                <select
                  id="register-college"
                  value={form.college}
                  onChange={e => handleChange('college', e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}
                  style={{ ...inputStyle, padding: '10px 12px' }}
                >
                  <option value="">Select</option>
                  {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>DEPARTMENT</label>
                <select
                  id="register-department"
                  value={form.department}
                  onChange={e => handleChange('department', e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}
                  style={{ ...inputStyle, padding: '10px 12px' }}
                >
                  <option value="">Select</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                width: '100%', padding: '12px',
                background: loading ? '#047857' : 'linear-gradient(135deg, #059669, #047857)',
                color: '#fff', border: 'none', borderRadius: '9px',
                fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#059669', fontWeight: '600', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}