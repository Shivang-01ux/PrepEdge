import { useState, useEffect, useCallback } from 'react'
import axiosInstance from '../../api/axiosInstance'

const DIFF_COLORS = { EASY: '#059669', MEDIUM: '#f59e0b', HARD: '#ef4444' }
const HOST = window.location.origin

export default function FacultyCreateAssessment() {
  // ── Question bank state ─────────────────────────────────────────────────
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [questions, setQuestions] = useState([])
  const [filters, setFilters] = useState({ subjectId: '', topicId: '', difficulty: '' })
  const [loadingQ, setLoadingQ] = useState(false)
  const [selected, setSelected] = useState(new Set()) // Set of question IDs

  // ── Assessment form state ────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '', accessPassword: '', durationMinutes: 30,
    startTime: '', endTime: '',
  })
  const [step, setStep] = useState('browse') // 'browse' | 'confirm' | 'done'
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // ── Load subjects on mount ───────────────────────────────────────────────
  useEffect(() => {
    axiosInstance.get('/questions/subjects').then(r => setSubjects(r.data)).catch(console.error)
  }, [])

  // ── Load topics when subject changes ────────────────────────────────────
  useEffect(() => {
    if (!filters.subjectId) { setTopics([]); return }
    axiosInstance.get(`/questions/topics?subjectId=${filters.subjectId}`)
      .then(r => setTopics(r.data)).catch(console.error)
  }, [filters.subjectId])

  // ── Load questions on filter change ─────────────────────────────────────
  const loadQuestions = useCallback(() => {
    setLoadingQ(true)
    const params = new URLSearchParams()
    if (filters.subjectId) params.append('subjectId', filters.subjectId)
    if (filters.topicId) params.append('topicId', filters.topicId)
    if (filters.difficulty) params.append('difficulty', filters.difficulty)
    axiosInstance.get(`/questions?${params}`)
      .then(r => setQuestions(r.data))
      .catch(console.error)
      .finally(() => setLoadingQ(false))
  }, [filters])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const toggleAll = () => {
    if (questions.every(q => selected.has(q.id))) {
      setSelected(prev => { const s = new Set(prev); questions.forEach(q => s.delete(q.id)); return s })
    } else {
      setSelected(prev => { const s = new Set(prev); questions.forEach(q => s.add(q.id)); return s })
    }
  }

  const handleCreate = async () => {
    if (!form.title.trim()) { setError('Please enter an assessment title'); return }
    if (!form.accessPassword.trim()) { setError('Please set an access password for students'); return }
    if (selected.size === 0) { setError('Please select at least one question'); return }
    setError(''); setCreating(true)
    try {
      const payload = {
        title: form.title,
        accessPassword: form.accessPassword,
        durationMinutes: parseInt(form.durationMinutes),
        questionIds: Array.from(selected),
        startTime: form.startTime ? form.startTime + ':00' : null,
        endTime: form.endTime ? form.endTime + ':00' : null,
      }
      const res = await axiosInstance.post('/faculty/assessments', payload)
      setResult(res.data)
      setStep('done')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create assessment')
    } finally {
      setCreating(false)
    }
  }

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }
  const input = {
    width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-hover)',
    borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px', color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box',
  }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '5px', letterSpacing: '0.05em' }

  // ── DONE screen ─────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    const shareLink = `${HOST}/test/${result.slug}`
    return (
      <div style={{ maxWidth: '600px' }}>
        <div style={{ ...card, background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.3)', textAlign: 'center', padding: '40px 32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Assessment Created!
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
            Share the link and password with your students
          </p>

          <div style={{ background: 'var(--bg-primary)', borderRadius: '10px', padding: '20px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>SHAREABLE LINK</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <code style={{
                flex: 1, background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '6px',
                fontSize: '13px', color: '#059669', wordBreak: 'break-all', fontFamily: 'monospace',
                border: '1px solid var(--border)',
              }}>{shareLink}</code>
              <button
                id="copy-link-btn"
                onClick={() => { navigator.clipboard.writeText(shareLink); }}
                style={{ padding: '10px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}
              >
                📋 Copy
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Password', value: form.accessPassword },
              { label: 'Questions', value: result.questionCount },
              { label: 'Duration', value: `${result.duration} min` },
              { label: 'Slug', value: result.slug },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>{item.label.toUpperCase()}</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setStep('browse'); setResult(null); setSelected(new Set()); setForm({ title: '', accessPassword: '', durationMinutes: 30, startTime: '', endTime: '' }) }}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            + Create Another Assessment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
          🔗 Create Assessment
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Browse the question bank → select questions → generate a shareable test link with password
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* ── LEFT: Question bank ──────────────────────────────────────── */}
        <div>
          {/* Filters */}
          <div style={{ ...card, marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 160px' }}>
                <label style={lbl}>SUBJECT</label>
                <select
                  id="filter-subject"
                  style={{ ...input, padding: '8px 12px' }}
                  value={filters.subjectId}
                  onChange={e => setFilters(f => ({ ...f, subjectId: e.target.value, topicId: '' }))}
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={lbl}>TOPIC</label>
                <select
                  id="filter-topic"
                  style={{ ...input, padding: '8px 12px' }}
                  value={filters.topicId}
                  onChange={e => setFilters(f => ({ ...f, topicId: e.target.value }))}
                  disabled={!filters.subjectId}
                >
                  <option value="">All Topics</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ flex: '0 0 140px' }}>
                <label style={lbl}>DIFFICULTY</label>
                <select
                  id="filter-difficulty"
                  style={{ ...input, padding: '8px 12px' }}
                  value={filters.difficulty}
                  onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}
                >
                  <option value="">All Levels</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Question list */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {loadingQ ? 'Loading…' : `${questions.length} questions`}
                {selected.size > 0 && (
                  <span style={{ marginLeft: '10px', padding: '2px 8px', background: 'rgba(5,150,105,0.12)', color: '#059669', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                    {selected.size} selected
                  </span>
                )}
              </div>
              {questions.length > 0 && (
                <button
                  id="select-all-btn"
                  onClick={toggleAll}
                  style={{ fontSize: '12px', color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                >
                  {questions.every(q => selected.has(q.id)) ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {loadingQ ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading questions…</div>
            ) : questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No questions match your filters</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto' }}>
                {questions.map((q, idx) => {
                  const isChecked = selected.has(q.id)
                  return (
                    <div
                      key={q.id}
                      id={`question-row-${q.id}`}
                      onClick={() => toggleSelect(q.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px',
                        borderRadius: '8px', cursor: 'pointer',
                        background: isChecked ? 'rgba(5,150,105,0.06)' : 'var(--bg-primary)',
                        border: `1px solid ${isChecked ? 'rgba(5,150,105,0.3)' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                        background: isChecked ? '#059669' : 'var(--bg-hover)',
                        border: `2px solid ${isChecked ? '#059669' : 'var(--border-hover)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {isChecked && (
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                            <path d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.4' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '6px', fontSize: '11px' }}>Q{idx + 1}</span>
                          {q.text}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: 'rgba(8,145,178,0.1)', color: '#0891b2', fontWeight: '600' }}>
                            {q.subject?.name || q.subjectName || '—'}
                          </span>
                          <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                            {q.topic?.name || q.topicName || '—'}
                          </span>
                          <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: '700',
                            background: `${DIFF_COLORS[q.difficulty] || '#059669'}15`,
                            color: DIFF_COLORS[q.difficulty] || '#059669',
                          }}>
                            {q.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Assessment settings ───────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selected count */}
          <div style={{
            ...card, textAlign: 'center', padding: '20px',
            background: selected.size > 0 ? 'rgba(5,150,105,0.06)' : 'var(--bg-card)',
            border: `1px solid ${selected.size > 0 ? 'rgba(5,150,105,0.3)' : 'var(--border)'}`,
          }}>
            <div style={{ fontSize: '38px', fontWeight: '800', color: selected.size > 0 ? '#059669' : 'var(--text-muted)' }}>
              {selected.size}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>questions selected</div>
          </div>

          {/* Form */}
          <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Assessment Settings
            </h3>

            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px', padding: '8px 12px', fontSize: '12px', color: 'var(--red)', marginBottom: '14px' }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={lbl}>TITLE *</label>
                <input
                  id="assessment-title"
                  placeholder="e.g. DSA Mid-Sem Test"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={input}
                />
              </div>

              <div>
                <label style={lbl}>ACCESS PASSWORD *</label>
                <input
                  id="assessment-password"
                  placeholder="Students enter this to unlock"
                  value={form.accessPassword}
                  onChange={e => setForm(f => ({ ...f, accessPassword: e.target.value }))}
                  style={input}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Share this with students along with the link
                </div>
              </div>

              <div>
                <label style={lbl}>DURATION (MINUTES)</label>
                <input
                  id="assessment-duration"
                  type="number" min={5} max={180}
                  value={form.durationMinutes}
                  onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
                  style={input}
                />
              </div>

              <div>
                <label style={lbl}>START TIME (optional)</label>
                <input
                  id="assessment-start"
                  type="datetime-local"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  style={{ ...input, colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label style={lbl}>END TIME (optional)</label>
                <input
                  id="assessment-end"
                  type="datetime-local"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  style={{ ...input, colorScheme: 'dark' }}
                />
              </div>
            </div>
          </div>

          <button
            id="create-assessment-btn"
            onClick={handleCreate}
            disabled={creating || selected.size === 0}
            style={{
              width: '100%', padding: '14px',
              background: selected.size > 0 ? 'linear-gradient(135deg,#059669,#047857)' : 'var(--bg-hover)',
              color: selected.size > 0 ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
              cursor: selected.size > 0 && !creating ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: selected.size > 0 ? '0 4px 16px rgba(5,150,105,0.3)' : 'none',
            }}
          >
            {creating ? '⏳ Creating…' : selected.size === 0 ? 'Select questions first' : `🔗 Generate Link (${selected.size} Qs)`}
          </button>
        </div>
      </div>
    </div>
  )
}
