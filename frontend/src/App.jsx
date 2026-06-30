import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from './api/axios'

import PublicHome from './pages/PublicHome'

import AuthPage from './pages/auth/AuthPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentLesson from './pages/student/StudentLesson'
import StudentCourses from './pages/student/StudentCourses'
import StudentForum from './pages/student/StudentForum'
import StudentForumPost from './pages/student/StudentForumPost'
import StudentHomework from './pages/student/StudentHomework'
import StudentProfile from './pages/student/StudentProfile'
import StudentRating from './pages/student/StudentRating'
import StudentSchedule from './pages/student/StudentSchedule'
import StudentNotifications from './pages/student/Studentnotifications'

import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherCourses from './pages/teacher/TeacherCourses'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherSchedule from './pages/teacher/TeacherSchedule'
import TeacherNotifications from './pages/teacher/TeacherNotifications'

const getRole = (user) => user?.is_admin ? 'teacher' : 'student'

function useCurrentRole() {
  const [token] = useState(() => localStorage.getItem('access'))
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(token))

  useEffect(() => {
    if (!token) return

    api.get('users/me/')
      .then(response => setRole(getRole(response.data)))
      .catch(() => {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
      })
      .finally(() => setLoading(false))
  }, [token])

  return { token, role, loading }
}

function RouteLoader() {
  return (
    <div className="app-loader">
      <div className="loader-inner"><span className="loader-dot" /> Проверяем доступ</div>
    </div>
  )
}

function RoleHome() {
  const { token, role, loading } = useCurrentRole()

  if (loading) return <RouteLoader />
  if (!token || !role) return <Navigate to="/login" replace />
  return <Navigate to={`/${role}/dashboard`} replace />
}

function RoleGate({ allowedRole }) {
  const { token, role, loading } = useCurrentRole()

  if (loading) return <RouteLoader />
  if (!token || !role) return <Navigate to="/login" replace />

  if (role !== allowedRole) {
    return <Navigate to={`/${role}/dashboard`} replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/app" element={<RoleHome />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<RoleGate allowedRole="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/lessons/:id" element={<StudentLesson />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/courses/:id" element={<StudentCourses />} />
          <Route path="/student/forum" element={<StudentForum />} />
          <Route path="/student/forum/:id" element={<StudentForumPost />} />
          <Route path="/student/homework" element={<StudentHomework />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/rating" element={<StudentRating />} />
          <Route path="/student/schedule" element={<StudentSchedule />} />
          <Route path="/student/notifications" element={<StudentNotifications />} />
        </Route>

        <Route element={<RoleGate allowedRole="teacher" />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/courses" element={<TeacherCourses />} />
          <Route path="/teacher/homeworks" element={<Navigate to="/teacher/courses" replace />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/schedule" element={<TeacherSchedule />} />
          <Route path="/teacher/notifications" element={<TeacherNotifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
