import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MCQPractice from './pages/MCQPractice'
import MockTest from './pages/MockTest'
import MockTestExam from './pages/MockTestExam'
import Results from './pages/Results'
import MockTestResult from './pages/MockTestResult'
import MockTestAnalysis from './pages/MockTestAnalysis'
import Leaderboard from './pages/Leaderboard'
import AdminFaculty from './pages/admin/AdminFaculty'
import FacultyUpload from './pages/faculty/FacultyUpload'
import FacultyStudents from './pages/faculty/FacultyStudents'

/** Redirect after login based on role */
function RoleRedirect() {
  const { user } = useAuth()
  if (user?.role === 'ROLE_ADMIN') return <Navigate to="/app/admin" replace />
  if (user?.role === 'ROLE_FACULTY') return <Navigate to="/app/faculty" replace />
  return <Navigate to="/app/dashboard" replace />
}

/** Route guard: only allow specific roles */
function RoleRoute({ allowed, children }) {
  const { user } = useAuth()
  if (!allowed.includes(user?.role)) return <Navigate to="/app/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected app routes */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route index element={<RoleRedirect />} />

            {/* Student routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="practice" element={<MCQPractice />} />
            <Route path="mock-tests" element={<MockTest />} />
            <Route path="mock-tests/:attemptId/exam" element={<MockTestExam />} />
            <Route path="results/:attemptId" element={<Results />} />
            <Route path="mock-results/:attemptId" element={<MockTestResult />} />
            <Route path="mock-analysis" element={<MockTestAnalysis />} />
            <Route path="leaderboard" element={<Leaderboard />} />

            {/* Admin routes */}
            <Route path="admin" element={
              <RoleRoute allowed={['ROLE_ADMIN']}>
                <AdminFaculty />
              </RoleRoute>
            } />
            <Route path="admin/faculty" element={
              <RoleRoute allowed={['ROLE_ADMIN']}>
                <AdminFaculty />
              </RoleRoute>
            } />

            {/* Faculty routes */}
            <Route path="faculty" element={
              <RoleRoute allowed={['ROLE_FACULTY', 'ROLE_ADMIN']}>
                <FacultyUpload />
              </RoleRoute>
            } />
            <Route path="faculty/upload" element={
              <RoleRoute allowed={['ROLE_FACULTY', 'ROLE_ADMIN']}>
                <FacultyUpload />
              </RoleRoute>
            } />
            <Route path="faculty/students" element={
              <RoleRoute allowed={['ROLE_FACULTY', 'ROLE_ADMIN']}>
                <FacultyStudents />
              </RoleRoute>
            } />
          </Route>

          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/practice" element={<Navigate to="/app/practice" replace />} />
          <Route path="/mock-tests" element={<Navigate to="/app/mock-tests" replace />} />
          <Route path="/leaderboard" element={<Navigate to="/app/leaderboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}