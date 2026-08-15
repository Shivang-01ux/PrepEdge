import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const studentLinks = [
  { to: '/app/dashboard', label: 'Dashboard', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { to: '/app/practice', label: 'MCQ Practice', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  )},
  { to: '/app/mock-tests', label: 'Mock Tests', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
    </svg>
  )},
  { to: '/app/mock-analysis', label: 'My Analysis', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M16 8v8m-4-5v5m-4-2v2M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  )},
  { to: '/app/leaderboard', label: 'Leaderboard', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  )},
]

const facultyLinks = [
  { to: '/app/faculty', label: 'Faculty Panel', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
    </svg>
  )},
  { to: '/app/faculty/upload', label: 'Upload Questions', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
    </svg>
  )},
  { to: '/app/faculty/students', label: 'My Students', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  )},
  ...studentLinks,
]

const adminLinks = [
  { to: '/app/admin', label: 'Admin Panel', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )},
  { to: '/app/admin/faculty', label: 'Manage Faculty', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 14l9-5-9-5-9 5 9 5z"/>
    </svg>
  )},
  { to: '/app/admin/students', label: 'All Students', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  )},
  { to: '/app/mock-tests', label: 'Mock Tests', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
    </svg>
  )},
  { to: '/app/leaderboard', label: 'Leaderboard', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  )},
]

const ROLE_BADGE = {
  ROLE_ADMIN: { label: 'ADMIN', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  ROLE_FACULTY: { label: 'FACULTY', color: '#0891b2', bg: 'rgba(8,145,178,0.12)' },
  ROLE_STUDENT: { label: 'STUDENT', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
}

export default function Sidebar() {
  const { user } = useAuth()
  const role = user?.role || 'ROLE_STUDENT'

  const links = role === 'ROLE_ADMIN'
    ? adminLinks
    : role === 'ROLE_FACULTY'
      ? facultyLinks
      : studentLinks

  const badge = ROLE_BADGE[role] || ROLE_BADGE.ROLE_STUDENT

  return (
    <aside style={{
      width: '228px', background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'relative', zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', boxShadow: '0 0 16px var(--accent-glow)',
          }}>⚡</div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
              Prep<span style={{ color: '#059669' }}>Edge</span>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.12em', marginTop: '2px' }}>
              PLACEMENT PREP
            </div>
          </div>
        </div>
        {/* Role badge */}
        <div style={{
          marginTop: '10px', display: 'inline-block',
          padding: '3px 8px', borderRadius: '20px',
          background: badge.bg, color: badge.color,
          fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em',
        }}>
          {badge.label}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '6px 10px 10px', fontWeight: '600' }}>
          NAVIGATION
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/app/admin' || link.to === '/app/faculty'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '8px',
              textDecoration: 'none', fontSize: '13.5px', fontWeight: '500',
              marginBottom: '2px', position: 'relative',
              background: isActive ? 'rgba(5,150,105,0.08)' : 'transparent',
              color: isActive ? '#059669' : 'var(--text-secondary)',
              borderLeft: `2px solid ${isActive ? '#059669' : 'transparent'}`,
              transition: 'all 0.15s',
            })}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>PrepEdge v1.0</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>© 2026 PrepEdge</div>
      </div>
    </aside>
  )
}