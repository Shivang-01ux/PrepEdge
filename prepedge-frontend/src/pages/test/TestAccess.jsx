import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'https://prepedge-backend-4aoe.onrender.com/api'

export default function TestAccess() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [meta, setMeta] = useState(null)      // assessment title/duration fetched after verify
  const [form, setForm] = useState({ name: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)  // initial slug validity check

  // Quick check slug exists (GET metadata without password)
  useEffect(() => {
    axios.get(`${API}/test/${slug}/info`)
      .then(r => { setMeta(r.data); setChecking(false) })
      .catch(() => setChecking(false))   // if no info endpoint, just show form
  }, [slug])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Please enter your name'); return }
    if (!form.password.trim()) { setError('Please enter the access password'); return }
    setError(''); setLoading(true)

    try {
      const res = await axios.post(`${API}/test/${slug}/verify`, { password: form.password })
      // Navigate to exam passing name + password via state (never stored in DB)
      navigate(`/test/${slug}/exam`, {
        state: {
          studentName: form.name.trim(),
          password: form.password,
          title: res.data.title,
          durationMinutes: res.data.durationMinutes,
          questionCount: res.data.questionCount,
        }
      })
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
    borderRadius: '10px', padding: '12px 14px', fontSize: '15px',
    color: '#1a202c', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const onFocus = e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.15)' }
  const onBlur  = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '18px', color: '#059669' }}>Loading test…</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '14px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', margin: '0 auto 12px',
            boxShadow: '0 8px 24px rgba(5,150,105,0.3)',
          }}>⚡</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a202c' }}>
            Prep<span style={{ color: '#059669' }}>Edge</span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Secure Assessment Portal</div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '36px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        }}>
          {/* Assessment title if available */}
          {meta?.title && (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
              border: '1px solid #86efac', borderRadius: '12px',
              padding: '14px 16px', marginBottom: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600', letterSpacing: '0.08em', marginBottom: '4px' }}>
                YOU ARE JOINING
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1a202c' }}>{meta.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {meta.questionCount} questions · {meta.durationMinutes} minutes
              </div>
            </div>
          )}

          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a202c', marginBottom: '6px' }}>
            Enter to Begin
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            Enter your name and the password given by your faculty. The test will start immediately in fullscreen.
          </p>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px',
              padding: '10px 14px', fontSize: '13px', color: '#dc2626',
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', letterSpacing: '0.06em' }}>
                YOUR FULL NAME
              </label>
              <input
                id="student-name"
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', letterSpacing: '0.06em' }}>
                ACCESS PASSWORD
              </label>
              <input
                id="test-password"
                type="password"
                required
                placeholder="Enter the password from your faculty"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={inputStyle}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Warnings */}
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: '10px', padding: '12px 14px', fontSize: '12px',
              color: '#92400e', lineHeight: '1.6',
            }}>
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>⚠ Before you start:</div>
              <div>• Test will open in <strong>fullscreen</strong> automatically</div>
              <div>• <strong>Switching tabs</strong> will auto-submit your test</div>
              <div>• <strong>Pressing Escape</strong> will auto-submit your test</div>
              <div>• Ensure stable internet before beginning</div>
            </div>

            <button
              id="start-test-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#e2e8f0' : 'linear-gradient(135deg, #059669, #047857)',
                color: loading ? '#94a3b8' : '#fff',
                border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(5,150,105,0.35)',
                transition: 'all 0.2s', marginTop: '4px',
              }}
            >
              {loading ? '⏳ Verifying…' : '🚀 Start Test →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
          PrepEdge · Secure Assessment System
        </p>
      </div>
    </div>
  )
}
