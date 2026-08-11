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

const checkPasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: '', color: 'transparent', width: '0%' }
  let score = 0
  if (pass.length >= 6) score += 1
  if (pass.length >= 8) score += 1
  if (/[0-9]/.test(pass)) score += 1
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
  if (/[^A-Za-z0-9]/.test(pass)) score += 1

  if (pass.length < 6) {
    return { score: 0, label: 'Too Short (Min 6 characters)', color: '#ef4444', width: '20%' }
  }
  if (score <= 2) {
    return { score: 1, label: 'Weak', color: '#ef4444', width: '40%' }
  } else if (score <= 4) {
    return { score: 2, label: 'Medium', color: '#f59e0b', width: '70%' }
  } else {
    return { score: 3, label: 'Strong', color: '#10b981', width: '100%' }
  }
}

export default function Register() {
  const [tab, setTab] = useState('student')  // 'student' | 'recruiter'

  // Student form state
  const [studentForm, setStudentForm] = useState({ username: '', email: '', password: '', college: '' })

  // Recruiter form state
  const [recruiterForm, setRecruiterForm] = useState({ fullName: '', workEmail: '', password: '', companyName: '', designation: '' })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let payload
      if (tab === 'recruiter') {
        payload = {
          username: recruiterForm.fullName,
          email: recruiterForm.workEmail,
          password: recruiterForm.password,
          role: 'ROLE_RECRUITER',
          companyName: recruiterForm.companyName,
        }
      } else {
        payload = {
          username: studentForm.username,
          email: studentForm.email,
          password: studentForm.password,
          college: studentForm.college,
        }
      }
      const res = await registerApi(payload)
      login(res.data.token, {
        username: res.data.username,
        email: res.data.email,
        role: res.data.role,
        college: res.data.college,
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
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
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
            {tab === 'recruiter' ? 'Recruiter Portal — Find top talent' : 'Start your placement journey today'}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
        }}>

          {/* ── Tab Switcher ── */}
          <div style={{
            display: 'flex', gap: '0', marginBottom: '28px',
            background: 'var(--bg-primary)', borderRadius: '10px',
            padding: '4px', border: '1px solid var(--border)',
          }}>
            {['student', 'recruiter'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                style={{
                  flex: 1, padding: '8px', fontSize: '13px', fontWeight: '600',
                  border: 'none', borderRadius: '7px', cursor: 'pointer',
                  background: tab === t ? '#059669' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                {t === 'student' ? 'Student' : 'Recruiter'}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
            {tab === 'recruiter' ? 'Create Recruiter Account' : 'Create your account'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
            {tab === 'recruiter' ? 'Access top placement-ready students' : 'Free forever · No credit card required'}
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

            {tab === 'student' ? (
              /* ── Student Fields ── */
              <>
                <div>
                  <label style={labelStyle}>USERNAME</label>
                  <input
                    type="text" required value={studentForm.username}
                    onChange={e => setStudentForm({ ...studentForm, username: e.target.value })}
                    placeholder="john_doe"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>EMAIL ADDRESS</label>
                  <input
                    type="email" required value={studentForm.email}
                    onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="you@college.edu"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>PASSWORD</label>
                  <input
                    type="password" required value={studentForm.password}
                    onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                  {/* Password Strength Bar — always shown once user types */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>Password Strength:</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: studentForm.password ? checkPasswordStrength(studentForm.password).color : '#9ca3af' }}>
                        {studentForm.password ? checkPasswordStrength(studentForm.password).label : 'Enter a password'}
                      </span>
                    </div>
                    <div style={{ height: '5px', width: '100%', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: studentForm.password ? checkPasswordStrength(studentForm.password).width : '0%',
                        backgroundColor: studentForm.password ? checkPasswordStrength(studentForm.password).color : '#e5e7eb',
                        transition: 'width 0.3s ease, background-color 0.3s ease',
                        borderRadius: '3px',
                      }} />
                    </div>
                  </div>

                </div>
                <div>
                  <label style={labelStyle}>COLLEGE / UNIVERSITY</label>
                  <select
                    value={studentForm.college}
                    onChange={e => setStudentForm({ ...studentForm, college: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={onFocus} onBlur={onBlur}
                  >
                    <option value="">Select your college</option>
                    {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            ) : (
              /* ── Recruiter Fields ── */
              <>
                <div>
                  <label style={labelStyle}>FULL NAME</label>
                  <input
                    type="text" required value={recruiterForm.fullName}
                    onChange={e => setRecruiterForm({ ...recruiterForm, fullName: e.target.value })}
                    placeholder="Jane Smith"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>WORK EMAIL</label>
                  <input
                    type="email" required value={recruiterForm.workEmail}
                    onChange={e => setRecruiterForm({ ...recruiterForm, workEmail: e.target.value })}
                    placeholder="you@company.com"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>PASSWORD</label>
                  <input
                    type="password" required value={recruiterForm.password}
                    onChange={e => setRecruiterForm({ ...recruiterForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                  {recruiterForm.password && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>Password Strength:</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: recruiterForm.password ? checkPasswordStrength(recruiterForm.password).color : '#9ca3af' }}>
                          {recruiterForm.password ? checkPasswordStrength(recruiterForm.password).label : 'Enter a password'}
                        </span>
                      </div>
                      <div style={{ height: '5px', width: '100%', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: checkPasswordStrength(recruiterForm.password).width,
                          backgroundColor: checkPasswordStrength(recruiterForm.password).color,
                          transition: 'width 0.3s ease, background-color 0.3s ease',
                          borderRadius: '3px',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>COMPANY NAME</label>
                  <input
                    type="text" required value={recruiterForm.companyName}
                    onChange={e => setRecruiterForm({ ...recruiterForm, companyName: e.target.value })}
                    placeholder="e.g. Infosys, TCS, Amazon"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>DESIGNATION <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    type="text" value={recruiterForm.designation}
                    onChange={e => setRecruiterForm({ ...recruiterForm, designation: e.target.value })}
                    placeholder="e.g. HR Manager, Tech Lead"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
              </>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'var(--bg-hover)' : 'linear-gradient(135deg, #059669, #047857)',
                color: loading ? 'var(--text-muted)' : 'white',
                border: 'none', borderRadius: '9px',
                padding: '13px', fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 24px var(--accent-glow)',
                transition: 'all 0.2s', marginTop: '6px',
              }}
            >
              {loading
                ? '⏳ Creating account...'
                : tab === 'recruiter' ? 'Create Recruiter Account →' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#34d399', fontWeight: '600', textDecoration: 'none' }}>
              Sign in
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