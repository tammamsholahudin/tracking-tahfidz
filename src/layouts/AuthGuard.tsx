import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/store/authStore'

interface AuthGuardProps {
  requiredRole?: UserRole
}

export default function AuthGuard({ requiredRole }: AuthGuardProps) {
  const { user, profile, isInitialized } = useAuthStore()

  if (!isInitialized) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--clr-primary-950)',
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: 48, height: 48,
            border: '3px solid rgba(255,255,255,0.2)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', opacity: 0.7 }}>
            Memuat...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole === 'admin' && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
