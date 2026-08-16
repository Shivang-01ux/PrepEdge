import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

export default function TestExam() {
  const { slug } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  // If no state (direct URL access), redirect to access page
  useEffect(() => {
    if (!state?.password) navigate(`/test/${slug}`, { replace: true })
  }, [state, slug, navigate])

  const { studentName, password, title, durationMinutes } = state || {}

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})       // { questionId: optionId }
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState((durationMinutes || 30) * 60)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [warnings, setWarnings] = useState(0)
  const [autoSubmitReason, setAutoSubmitReason] = useState('')
  const [fullscreenLost, setFullscreenLost] = useState(false)

  const timerRef = useRef(null)
  const submitRef = useRef(null)  // stable ref to submit fn

  // ── Load questions ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!password) return
    axiosInstance.post(`/test/${slug}/questions`, { password })
      .then(r => {
        setQuestions(r.data.questions || [])
        setTimeLeft((r.data.durationMinutes || durationMinutes || 30) * 60)
        setLoading(false)
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to load test. Please try again.'
        setLoadError(msg)
        setLoading(false)
      })
  }, [slug, password])

  // ── Request fullscreen ─────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen()
  }, [loading])

  // ── Submit function (stable via ref) ───────────────────────────────────
  const doSubmit = useCallback(async (reason = '', currentAnswers) => {
    if (submitted || submitting) return
    setSubmitting(true)
    setAutoSubmitReason(reason)
    clearInterval(timerRef.current)

    // Exit fullscreen
    try {
      if (document.exitFullscreen) await document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    } catch (_) {}

    try {
      const res = await axiosInstance.post(`/test/${slug}/submit`, {
        password,
        studentName,
        answers: currentAnswers || {},
      })
      setResult(res.data)
      setSubmitted(true)
    } catch (e) {
      // Even on error, show submitted state
      setSubmitted(true)
      setResult({ score: 0, total: questions.length, percentage: 0, studentName, title })
    } finally {
      setSubmitting(false)
    }
  }, [submitted, submitting, slug, password, studentName, questions.length])

  // Keep ref up to date
  submitRef.current = doSubmit

  // ── Timer countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          submitRef.current('Time is up!', answers)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [loading, submitted])

  // ── Tab switch / visibility detection → auto submit ────────────────────
  useEffect(() => {
    if (loading || submitted) return

    const handleVisibility = () => {
      if (document.hidden) {
        setWarnings(w => {
          const newW = w + 1
          if (newW >= 1) {
            // Auto submit immediately on first tab switch
            submitRef.current('You switched tabs — test auto-submitted.', answers)
          }
          return newW
        })
      }
    }

    const handleBlur = () => {
      // Window lost focus (switched app/tab)
      submitRef.current('Window focus lost — test auto-submitted.', answers)
    }

    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      )
      if (!isFullscreen && !submitted) {
        setFullscreenLost(true)
        submitRef.current('Fullscreen exited — test auto-submitted.', answers)
      }
    }

    const handleKeydown = (e) => {
      // Block Escape from exiting fullscreen without auto-submit
      if (e.key === 'Escape') {
        // ESC is handled by fullscreenchange above
      }
      // Block F12, Ctrl+Shift+I (devtools)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [loading, submitted, answers])

  const selectAnswer = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const answered = Object.keys(answers).length
  const isLastQ = currentIdx === questions.length - 1
  const currentQ = questions[currentIdx]
  const timePercent = timeLeft / ((durationMinutes || 30) * 60) * 100
  const isTimeCritical = timeLeft <= 60

  // ── LOADING ────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>Loading your test…</div>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Please wait</div>
      </div>
    </div>
  )

  // ── LOAD ERROR ─────────────────────────────────────────────────────────
  if (loadError) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', color: '#fff', maxWidth: '400px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Could not load test</div>
        <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>{loadError}</div>
        <button
          onClick={() => navigate(`/test/${slug}`, { replace: true })}
          style={{ padding: '10px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  )

  // ── RESULT SCREEN ──────────────────────────────────────────────────────
  if (submitted && result) {
    const pct = result.percentage || 0
    const passed = pct >= 60
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        <div style={{
          width: '100%', maxWidth: '560px',
          background: '#1e293b', borderRadius: '20px',
          padding: '40px', border: '1px solid #334155',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>{passed ? '🎉' : '📝'}</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#f1f5f9', marginBottom: '6px' }}>
              Test Submitted!
            </h1>
            {autoSubmitReason && (
              <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#fca5a5', marginBottom: '12px' }}>
                ⚠ Auto-submitted: {autoSubmitReason}
              </div>
            )}
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              {result.studentName} · {result.title || title}
            </div>
          </div>

          {/* Score */}
          <div style={{
            background: passed ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${passed ? 'rgba(5,150,105,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: '16px', padding: '28px', textAlign: 'center', marginBottom: '24px',
          }}>
            <div style={{ fontSize: '64px', fontWeight: '900', color: passed ? '#10b981' : '#ef4444' }}>
              {pct}%
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', marginTop: '4px' }}>
              {result.score} / {result.total} correct
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {passed ? '✅ Passed' : '❌ Needs improvement'}
            </div>
          </div>

          {/* Answer review */}
          {result.result && result.result.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '12px', letterSpacing: '0.05em' }}>
                ANSWER REVIEW
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.result.map((r, i) => (
                  <div key={i} style={{
                    background: r.isCorrect ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${r.isCorrect ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: '8px', padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Q{i + 1}</div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '6px' }}>{r.questionText}</div>
                    <div style={{ fontSize: '12px', color: r.isCorrect ? '#10b981' : '#ef4444' }}>
                      {r.isCorrect ? '✓ Correct' : `✗ Correct: ${r.correctOptionText}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── EXAM SCREEN ────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      userSelect: 'none',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        background: '#1e293b', borderBottom: '1px solid #334155',
        padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
      }}>
        {/* Left: title + student */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
          }}>⚡</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>{title}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{studentName}</div>
          </div>
        </div>

        {/* Center: Timer */}
        <div style={{
          background: isTimeCritical ? 'rgba(239,68,68,0.15)' : 'rgba(5,150,105,0.1)',
          border: `1px solid ${isTimeCritical ? 'rgba(239,68,68,0.4)' : 'rgba(5,150,105,0.3)'}`,
          borderRadius: '10px', padding: '6px 16px', textAlign: 'center',
          animation: isTimeCritical ? 'pulse 1s infinite' : 'none',
        }}>
          <div style={{ fontSize: '11px', color: isTimeCritical ? '#ef4444' : '#10b981', fontWeight: '600', letterSpacing: '0.05em' }}>
            TIME LEFT
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: isTimeCritical ? '#ef4444' : '#10b981', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Right: Progress */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>
            {answered}/{questions.length} answered
          </div>
          <div style={{ width: '120px', height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${(answered / questions.length) * 100}%`,
              height: '100%', background: '#059669', transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>

      {/* ── Timer bar ── */}
      <div style={{ height: '3px', background: '#1e293b' }}>
        <div style={{
          width: `${timePercent}%`, height: '100%',
          background: isTimeCritical
            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
            : 'linear-gradient(90deg, #059669, #10b981)',
          transition: 'width 1s linear',
        }} />
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '24px', gap: '20px' }}>

        {/* Left: Question navigator */}
        <div style={{
          width: '200px', flexShrink: 0,
          background: '#1e293b', borderRadius: '12px', padding: '16px',
          border: '1px solid #334155', alignSelf: 'flex-start',
          position: 'sticky', top: '80px',
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', letterSpacing: '0.06em', marginBottom: '12px' }}>
            QUESTIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] !== undefined
              const isCurrent = i === currentIdx
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '6px',
                    border: `2px solid ${isCurrent ? '#059669' : isAnswered ? 'rgba(5,150,105,0.4)' : '#334155'}`,
                    background: isCurrent ? '#059669' : isAnswered ? 'rgba(5,150,105,0.15)' : 'transparent',
                    color: isCurrent ? '#fff' : isAnswered ? '#10b981' : '#64748b',
                    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '3px', background: 'rgba(5,150,105,0.15)', border: '1.5px solid rgba(5,150,105,0.4)' }} />
              Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '3px', background: 'transparent', border: '1.5px solid #334155' }} />
              Not answered
            </div>
          </div>
        </div>

        {/* Right: Question + options */}
        {currentQ && (
          <div style={{ flex: 1 }}>
            <div style={{
              background: '#1e293b', borderRadius: '16px',
              border: '1px solid #334155', padding: '28px 32px', marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span style={{
                  fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '700',
                  background: currentQ.difficulty === 'EASY' ? 'rgba(5,150,105,0.15)' : currentQ.difficulty === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  color: currentQ.difficulty === 'EASY' ? '#10b981' : currentQ.difficulty === 'MEDIUM' ? '#f59e0b' : '#ef4444',
                }}>
                  {currentQ.difficulty}
                </span>
              </div>

              <p style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.6', marginBottom: '28px' }}>
                {currentQ.text}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentQ.options?.map((opt, oi) => {
                  const isSelected = answers[currentQ.id] === opt.id
                  const letter = ['A', 'B', 'C', 'D'][oi]
                  return (
                    <div
                      key={opt.id}
                      id={`option-${opt.id}`}
                      onClick={() => selectAnswer(currentQ.id, opt.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                        padding: '14px 18px', borderRadius: '10px', cursor: 'pointer',
                        border: `2px solid ${isSelected ? '#059669' : '#334155'}`,
                        background: isSelected ? 'rgba(5,150,105,0.1)' : 'rgba(30,41,59,0.5)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? '#059669' : '#475569'}`,
                        background: isSelected ? '#059669' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700',
                        color: isSelected ? '#fff' : '#94a3b8',
                        transition: 'all 0.15s',
                      }}>
                        {letter}
                      </div>
                      <span style={{ fontSize: '15px', color: isSelected ? '#f1f5f9' : '#cbd5e1', lineHeight: '1.5', paddingTop: '2px' }}>
                        {opt.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                style={{
                  padding: '10px 20px', background: currentIdx === 0 ? '#1e293b' : '#334155',
                  color: currentIdx === 0 ? '#475569' : '#e2e8f0',
                  border: '1px solid #475569', borderRadius: '8px', fontSize: '14px',
                  cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', fontWeight: '600',
                }}
              >
                ← Previous
              </button>

              {isLastQ ? (
                <button
                  id="submit-test-btn"
                  onClick={() => doSubmit('Manual submit', answers)}
                  disabled={submitting}
                  style={{
                    padding: '11px 28px',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(5,150,105,0.35)',
                  }}
                >
                  {submitting ? '⏳ Submitting…' : '✅ Submit Test'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                  style={{
                    padding: '10px 20px', background: '#059669', color: '#fff',
                    border: 'none', borderRadius: '8px', fontSize: '14px',
                    cursor: 'pointer', fontWeight: '600',
                  }}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
