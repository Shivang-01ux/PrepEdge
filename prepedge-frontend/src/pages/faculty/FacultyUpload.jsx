import { useState } from 'react'
import axiosInstance from '../../api/axiosInstance'

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']

const EMPTY_Q = () => ({
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctOption: 'A', subject: '', topic: '', difficulty: 'MEDIUM', explanation: '',
})

const CSV_TEMPLATE = `question_text,option_a,option_b,option_c,option_d,correct_option,subject,topic,difficulty
What is the time complexity of binary search?,O(n),O(log n),O(n log n),O(1),B,DSA,Searching,EASY
What does OOP stand for?,Object-Oriented Protocol,Object-Oriented Programming,Open Oriented Programming,Optional Object Paradigm,B,CS Fundamentals,OOP,EASY`

export default function FacultyUpload() {
  const [tab, setTab] = useState('manual') // 'manual' | 'csv'

  // ── Manual state ──
  const [numQ, setNumQ] = useState('')
  const [questions, setQuestions] = useState([])
  const [expandedIdx, setExpandedIdx] = useState(0)
  const [manualLoading, setManualLoading] = useState(false)
  const [manualResult, setManualResult] = useState(null)

  // ── CSV state ──
  const [csvFile, setCsvFile] = useState(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvResult, setCsvResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  // ── Shared ──
  const [error, setError] = useState('')

  const startManual = () => {
    const n = parseInt(numQ)
    if (!n || n < 1 || n > 100) { setError('Enter a number between 1 and 100'); return }
    setError('')
    setQuestions(Array.from({ length: n }, EMPTY_Q))
    setExpandedIdx(0)
    setManualResult(null)
  }

  const updateQ = (idx, field, value) => {
    setQuestions(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const isQComplete = (q) =>
    q.questionText && q.optionA && q.optionB && q.optionC && q.optionD && q.subject && q.topic

  const handleManualSubmit = async () => {
    const incomplete = questions.findIndex(q => !isQComplete(q))
    if (incomplete !== -1) {
      setError(`Q${incomplete + 1} is incomplete. Please fill all fields.`)
      setExpandedIdx(incomplete)
      return
    }
    setError(''); setManualLoading(true)
    let uploaded = 0, failed = 0, errors = []
    for (let i = 0; i < questions.length; i++) {
      try {
        await axiosInstance.post('/faculty/questions', questions[i])
        uploaded++
      } catch (e) {
        failed++
        errors.push(`Q${i + 1}: ${e.response?.data?.message || e.message}`)
      }
    }
    setManualLoading(false)
    setManualResult({ uploaded, failed, errors })
    if (uploaded === questions.length) setQuestions([])
  }

  const handleCsvUpload = async () => {
    if (!csvFile) { setError('Please select a CSV file'); return }
    setError(''); setCsvLoading(true)
    const formData = new FormData()
    formData.append('file', csvFile)
    try {
      const res = await axiosInstance.post('/faculty/questions/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setCsvResult(res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Upload failed')
    } finally {
      setCsvLoading(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'prepedge_questions_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filledCount = questions.filter(isQComplete).length

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }
  const input = {
    width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-hover)',
    borderRadius: '8px', padding: '9px 12px', fontSize: '13.5px', color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box',
  }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '5px', letterSpacing: '0.05em' }

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
          📤 Upload Questions
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Add questions to the student practice bank — manually or via CSV bulk upload
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: '0', marginBottom: '24px',
        background: 'var(--bg-card)', borderRadius: '10px',
        padding: '4px', border: '1px solid var(--border)', width: 'fit-content',
      }}>
        {[
          { key: 'manual', label: '✏️  Manual Entry' },
          { key: 'csv', label: '📄  CSV Bulk Upload' },
        ].map(t => (
          <button
            key={t.key}
            id={`upload-tab-${t.key}`}
            onClick={() => { setTab(t.key); setError(''); setManualResult(null); setCsvResult(null) }}
            style={{
              padding: '9px 20px', fontSize: '13px', fontWeight: '600',
              border: 'none', borderRadius: '7px', cursor: 'pointer',
              background: tab === t.key ? '#059669' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Global error */}
      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9px', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '20px' }}>
          ⚠ {error}
        </div>
      )}

      {/* ── MANUAL TAB ── */}
      {tab === 'manual' && (
        <div>
          {questions.length === 0 ? (
            <div style={card}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                How many questions do you want to add?
              </h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>NUMBER OF QUESTIONS (1–100)</label>
                  <input
                    id="manual-num-questions"
                    type="number" min={1} max={100}
                    placeholder="e.g. 10"
                    value={numQ}
                    onChange={e => setNumQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startManual()}
                    style={{ ...input, maxWidth: '160px', fontSize: '15px', fontWeight: '600' }}
                  />
                </div>
                <button
                  id="manual-start-btn"
                  onClick={startManual}
                  style={{
                    padding: '10px 24px', background: 'linear-gradient(135deg,#059669,#047857)',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  }}
                >Start →</button>
              </div>
            </div>
          ) : (
            <div>
              {/* Progress bar */}
              <div style={{ ...card, marginBottom: '16px', padding: '16px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {filledCount} of {questions.length} questions filled
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setQuestions([])} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>Reset</button>
                    <button
                      id="manual-submit-all"
                      onClick={handleManualSubmit}
                      disabled={manualLoading}
                      style={{
                        padding: '5px 16px', background: 'linear-gradient(135deg,#059669,#047857)',
                        color: '#fff', border: 'none', borderRadius: '6px',
                        fontSize: '12px', fontWeight: '600', cursor: manualLoading ? 'not-allowed' : 'pointer',
                        opacity: manualLoading ? 0.7 : 1,
                      }}
                    >
                      {manualLoading ? 'Submitting…' : `Submit All ${questions.length} Questions`}
                    </button>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(filledCount / questions.length) * 100}%`,
                    height: '100%', background: 'linear-gradient(90deg,#059669,#10b981)',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>

              {/* Result */}
              {manualResult && (
                <div style={{
                  ...card, marginBottom: '16px',
                  background: manualResult.failed === 0 ? 'rgba(5,150,105,0.06)' : 'rgba(245,158,11,0.06)',
                  border: `1px solid ${manualResult.failed === 0 ? 'rgba(5,150,105,0.3)' : 'rgba(245,158,11,0.3)'}`,
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Upload Complete
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '13.5px' }}>
                    <span style={{ color: '#059669' }}>✅ {manualResult.uploaded} uploaded</span>
                    {manualResult.failed > 0 && <span style={{ color: '#f59e0b' }}>⚠ {manualResult.failed} failed</span>}
                  </div>
                  {manualResult.errors.length > 0 && (
                    <ul style={{ marginTop: '8px', fontSize: '12px', color: 'var(--red)', paddingLeft: '16px' }}>
                      {manualResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {/* Question cards */}
              {questions.map((q, idx) => (
                <div key={idx} style={{
                  ...card, marginBottom: '12px', cursor: 'pointer',
                  border: expandedIdx === idx ? '1px solid #059669' : '1px solid var(--border)',
                }}>
                  <div
                    onClick={() => setExpandedIdx(expandedIdx === idx ? -1 : idx)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isQComplete(q) ? 'rgba(5,150,105,0.15)' : 'var(--bg-hover)',
                        color: isQComplete(q) ? '#059669' : 'var(--text-muted)',
                        fontSize: '12px', fontWeight: '700',
                      }}>
                        {isQComplete(q) ? '✓' : idx + 1}
                      </div>
                      <div style={{ fontSize: '13.5px', color: q.questionText ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: q.questionText ? '500' : '400' }}>
                        {q.questionText ? q.questionText.substring(0, 70) + (q.questionText.length > 70 ? '…' : '') : `Question ${idx + 1} — click to fill`}
                      </div>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      style={{ transform: expandedIdx === idx ? 'rotate(180deg)' : 'none', transition: '0.2s', color: 'var(--text-muted)', flexShrink: 0 }}>
                      <path d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>

                  {expandedIdx === idx && (
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }} onClick={e => e.stopPropagation()}>
                      {/* Question text */}
                      <div>
                        <label style={lbl}>QUESTION TEXT *</label>
                        <textarea
                          rows={3}
                          placeholder="Type your question here…"
                          value={q.questionText}
                          onChange={e => updateQ(idx, 'questionText', e.target.value)}
                          style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>

                      {/* Options */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <div key={opt}>
                            <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                value={opt}
                                checked={q.correctOption === opt}
                                onChange={() => updateQ(idx, 'correctOption', opt)}
                                style={{ accentColor: '#059669' }}
                              />
                              OPTION {opt} {q.correctOption === opt && <span style={{ color: '#059669' }}>(Correct)</span>}
                            </label>
                            <input
                              placeholder={`Option ${opt}`}
                              value={q[`option${opt}`]}
                              onChange={e => updateQ(idx, `option${opt}`, e.target.value)}
                              style={input}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Subject, Topic, Difficulty */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={lbl}>SUBJECT *</label>
                          <input placeholder="e.g. DSA" value={q.subject} onChange={e => updateQ(idx, 'subject', e.target.value)} style={input} />
                        </div>
                        <div>
                          <label style={lbl}>TOPIC *</label>
                          <input placeholder="e.g. Arrays" value={q.topic} onChange={e => updateQ(idx, 'topic', e.target.value)} style={input} />
                        </div>
                        <div>
                          <label style={lbl}>DIFFICULTY</label>
                          <select value={q.difficulty} onChange={e => updateQ(idx, 'difficulty', e.target.value)} style={{ ...input, padding: '8px 12px' }}>
                            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div>
                        <label style={lbl}>EXPLANATION (Optional)</label>
                        <textarea
                          rows={2}
                          placeholder="Brief explanation of the correct answer…"
                          value={q.explanation}
                          onChange={e => updateQ(idx, 'explanation', e.target.value)}
                          style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CSV TAB ── */}
      {tab === 'csv' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Step 1: Download template */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px', background: 'rgba(5,150,105,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
              }}>1️⃣</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Download the template
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Fill it in Excel or Google Sheets, then save as CSV
                </div>
              </div>
              <button
                id="download-csv-template"
                onClick={downloadTemplate}
                style={{
                  padding: '8px 16px', background: 'var(--bg-hover)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                ⬇ Download Template
              </button>
            </div>
            {/* Column guide */}
            <div style={{
              marginTop: '14px', background: 'var(--bg-primary)', borderRadius: '8px',
              padding: '12px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)',
              overflowX: 'auto', whiteSpace: 'nowrap',
            }}>
              question_text | option_a | option_b | option_c | option_d | correct_option | subject | topic | difficulty
            </div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>correct_option: A, B, C, or D</span>
              <span>difficulty: EASY, MEDIUM, or HARD</span>
            </div>
          </div>

          {/* Step 2: Upload */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px', background: 'rgba(5,150,105,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
              }}>2️⃣</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Upload your CSV file
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Drag & drop or click to select</div>
              </div>
            </div>

            {/* Drop zone */}
            <div
              id="csv-dropzone"
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setCsvFile(f) }}
              onClick={() => document.getElementById('csv-file-input').click()}
              style={{
                border: `2px dashed ${dragOver ? '#059669' : csvFile ? 'rgba(5,150,105,0.5)' : 'var(--border)'}`,
                borderRadius: '10px', padding: '32px',
                textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'rgba(5,150,105,0.04)' : csvFile ? 'rgba(5,150,105,0.02)' : 'var(--bg-primary)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{csvFile ? '📄' : '☁️'}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {csvFile ? csvFile.name : 'Drop CSV file here'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'or click to browse'}
              </div>
              <input id="csv-file-input" type="file" accept=".csv" style={{ display: 'none' }}
                onChange={e => setCsvFile(e.target.files[0])} />
            </div>

            {csvFile && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button
                  id="csv-upload-btn"
                  onClick={handleCsvUpload}
                  disabled={csvLoading}
                  style={{
                    padding: '10px 24px', background: 'linear-gradient(135deg,#059669,#047857)',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    fontSize: '14px', fontWeight: '600', cursor: csvLoading ? 'not-allowed' : 'pointer',
                    opacity: csvLoading ? 0.7 : 1,
                  }}
                >
                  {csvLoading ? 'Uploading…' : '⬆ Upload & Import'}
                </button>
                <button onClick={() => { setCsvFile(null); setCsvResult(null) }}
                  style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Results */}
          {csvResult && (
            <div style={{
              ...card,
              background: csvResult.failed === 0 ? 'rgba(5,150,105,0.06)' : 'rgba(245,158,11,0.06)',
              border: `1px solid ${csvResult.failed === 0 ? 'rgba(5,150,105,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div style={{ fontSize: '28px' }}>{csvResult.failed === 0 ? '✅' : '⚠️'}</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Upload Complete</div>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '4px', fontSize: '13.5px' }}>
                    <span style={{ color: '#059669', fontWeight: '600' }}>{csvResult.uploaded} uploaded</span>
                    {csvResult.failed > 0 && <span style={{ color: '#f59e0b', fontWeight: '600' }}>{csvResult.failed} skipped</span>}
                  </div>
                </div>
              </div>
              {csvResult.errors?.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>ROW ERRORS:</div>
                  <ul style={{ fontSize: '12px', color: 'var(--red)', paddingLeft: '16px', margin: 0 }}>
                    {csvResult.errors.map((e, i) => <li key={i} style={{ marginBottom: '3px' }}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
