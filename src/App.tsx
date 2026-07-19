import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/layouts/AuthGuard'
import AppLayout from '@/layouts/AppLayout'

// Lazy Load Pages
const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Profile = lazy(() => import('@/pages/Profile'))
const Pengaturan = lazy(() => import('@/pages/Pengaturan'))
const MasterIndex = lazy(() => import('@/pages/master/MasterIndex'))
const SchoolIndex = lazy(() => import('@/pages/school/SchoolIndex'))
const ClassDashboard = lazy(() => import('@/pages/school/ClassDashboard'))
const LessonIndex = lazy(() => import('@/pages/lesson/LessonIndex'))
const PrivateIndex = lazy(() => import('@/pages/private/PrivateIndex'))
const TrashIndex = lazy(() => import('@/pages/TrashIndex'))
const ParentPortal = lazy(() => import('@/pages/portal/ParentPortal'))
const AktivitasTerakhir = lazy(() => import('@/pages/AktivitasTerakhir'))

import '@/styles/global.css'

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
    
    // Auto-refresh data when user comes back to the tab
    const handleFocus = () => {
      import('@/lib/db').then(({ fetchAllBackground }) => fetchAllBackground())
    }
    window.addEventListener('focus', handleFocus)
    
    // Also fetch immediately on mount if initialized
    import('@/lib/db').then(({ fetchAllBackground }) => fetchAllBackground())

    return () => window.removeEventListener('focus', handleFocus)
  }, [initialize])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
          },
          success: {
            iconTheme: { primary: 'var(--clr-primary-600)', secondary: 'white' },
          },
        }}
      />

      <Suspense fallback={<div className="lazy-loader">Memuat halaman...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/portal/:classId" element={<ParentPortal />} />

          {/* Protected */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"         element={<Dashboard />} />
              <Route path="/sekolah"           element={<SchoolIndex />} />
              <Route path="/sekolah/:classId"  element={<ClassDashboard />} />
              <Route path="/les"               element={<LessonIndex />} />
              <Route path="/les/:classId"      element={<ClassDashboard />} />
              <Route path="/privat"            element={<PrivateIndex />} />
              <Route path="/privat/:classId"   element={<ClassDashboard />} />
              <Route path="/sampah"            element={<TrashIndex />} />
              <Route path="/profil"            element={<Profile />} />
              <Route path="/pengaturan"        element={<Pengaturan />} />
              <Route path="/aktivitas"         element={<AktivitasTerakhir />} />
            </Route>
          </Route>

          {/* Admin Only */}
          <Route element={<AuthGuard requiredRole="admin" />}>
            <Route element={<AppLayout />}>
              <Route path="/master"  element={<MasterIndex />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

