import { useState, useEffect } from 'react'
import axiosInstance from '../../api/axiosInstance'

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Data Science', 'AI/ML', 'Other']
const COLLEGES = ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'NIT Trichy', 'NIT Warangal', 'BITS Pilani', 'VIT Vellore', 'VIT Chennai', 'SRM Chennai', 'Manipal MIT', 'IIIT Hyderabad', 'DTU Delhi', 'Chandigarh University', 'LPU', 'Thapar University', 'Other']

export default function AdminFaculty() {
  const [faculties, setFaculties] = useState([])
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', department: '', college: '' })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [fRes, sRes] = await Promise.all([
        axiosInstance.get('/admin/faculty'),
        axiosInstance.get('/admin/stats'),
      ])
      setFaculties(fRes.data)
      setStats(sRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError(''); setFormSuccess('')
    setSubmitting(true)
    try {
      await axiosInstance.post('/admin/faculty', form)
      setFormSuccess(`✅ Faculty account created for ${form.email}`)
      setForm({ username: '', email: '', password: '', department: '', college: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create faculty')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/admin/faculty/${id}`)
      setFaculties(prev => prev.filter(f => f.id !== id))
      setDeleteId(null)
    } catch (e) {
      alert('Failed to delete faculty')
    }
  }

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }
  const input = {
    width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-hover)',
    borderRadius: '8px', padding: '10px 12px', fontSize: '13.5px', color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box',
  }
  const label = { display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.05em' }

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
          ⚙️ Admin Panel
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Manage faculty accounts and monitor platform activity
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: '🎓', color: '#059669' },
          { label: 'Total Faculty', value: stats.totalFaculty, icon: '👨‍🏫', color: '#0891b2' },
          { label: 'Departments Active', value: [...new Set(faculties.map(f => f.department).filter(Boolean))].length, icon: '🏛️', color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '10px', fontSize: '22px',
              background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Faculty management */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Faculty Members</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{faculties.length} account(s) registered</p>
          </div>
          <button
            id="admin-add-faculty-btn"
            onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess('') }}
            style={{
              padding: '9px 18px', background: 'linear-gradient(135deg,#059669,#047857)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {showForm ? '✕ Cancel' : '+ Add Faculty'}
          </button>
        </div>

        {/* Success/Error */}
        {formSuccess && (
          <div style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#059669', marginBottom: '16px' }}>
            {formSuccess}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '20px', marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Create New Faculty Account
            </h3>
            {formError && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--red)', marginBottom: '14px' }}>
                ⚠ {formError}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={label}>FULL NAME</label>
                <input id="faculty-name" style={input} placeholder="Dr. Sharma" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
              </div>
              <div>
                <label style={label}>EMAIL</label>
                <input id="faculty-email" type="email" style={input} placeholder="faculty@college.edu" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label style={label}>TEMPORARY PASSWORD</label>
                <input id="faculty-password" type="password" style={input} placeholder="Min 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
              </div>
              <div>
                <label style={label}>DEPARTMENT</label>
                <select id="faculty-dept" style={{ ...input, padding: '9px 12px' }} value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} required>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={label}>COLLEGE</label>
                <select id="faculty-college" style={{ ...input, padding: '9px 12px' }} value={form.college} onChange={e => setForm(p => ({ ...p, college: e.target.value }))}>
                  <option value="">Select college (optional)</option>
                  {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button
              id="faculty-create-submit"
              type="submit"
              disabled={submitting}
              style={{
                marginTop: '16px', padding: '10px 24px',
                background: 'linear-gradient(135deg,#059669,#047857)',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Creating…' : 'Create Faculty Account'}
            </button>
          </form>
        )}

        {/* Faculty Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</div>
        ) : faculties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No faculty accounts yet. Click "+ Add Faculty" to create one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Email', 'Department', 'College', 'Created', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', letterSpacing: '0.05em' }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {faculties.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{f.username}</div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{f.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', background: 'rgba(8,145,178,0.1)', color: '#0891b2', fontSize: '11px', fontWeight: '600' }}>
                        {f.department || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>{f.college || '—'}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {deleteId === f.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleDelete(f.id)} style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Confirm</button>
                          <button onClick={() => setDeleteId(null)} style={{ padding: '4px 10px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(f.id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
