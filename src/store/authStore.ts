import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'guru'

export interface TeacherProfile {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  photo_url: string | null
  role: UserRole
  is_active: boolean
}

interface AuthState {
  user: { id: string } | null
  profile: TeacherProfile | null
  isLoading: boolean
  isInitialized: boolean
  activeWorkspaceId: string | null

  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<TeacherProfile>) => void
  setActiveWorkspaceId: (id: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: false,
      activeWorkspaceId: null,

      initialize: async () => {
        set({ isLoading: true })
        try {
          const stored = get().profile
          set({ isInitialized: true, isLoading: false, profile: stored })
        } catch (err) {
          console.error('Auth init error:', err)
        } finally {
          set({ isLoading: false, isInitialized: true })
        }
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          await new Promise(r => setTimeout(r, 500)) // simulasi network latency

          const teachers = JSON.parse(localStorage.getItem('tahfidz_teachers') || '[]')
          const passwords: Record<string, string> = JSON.parse(localStorage.getItem('tahfidz_teacher_passwords') || '{}')
          
          // First time setup: If database is completely empty, register the first user as Admin
          if (teachers.length === 0) {
            const newAdminId = 'admin-' + Date.now()
            const newAdmin = {
              id: newAdminId,
              name: 'Admin Utama',
              email: email.toLowerCase(),
              phone: '',
              role: 'admin',
              is_active: true,
              created_at: new Date().toISOString()
            }
            
            teachers.push(newAdmin)
            passwords[email.toLowerCase()] = password
            
            localStorage.setItem('tahfidz_teachers', JSON.stringify(teachers))
            localStorage.setItem('tahfidz_teacher_passwords', JSON.stringify(passwords))
            
            set({
              profile: {
                id: newAdminId,
                user_id: newAdminId,
                name: newAdmin.name,
                email: newAdmin.email,
                phone: null,
                photo_url: null,
                role: 'admin',
                is_active: true,
              },
              user: { id: newAdminId },
              activeWorkspaceId: newAdminId
            })
            return { error: null }
          }

          const teacher = teachers.find((t: any) => t.email?.toLowerCase() === email.toLowerCase() && t.is_active)
          
          if (teacher) {
            const storedPass = passwords[email.toLowerCase()]

            if (storedPass && storedPass === password) {
              set({
                profile: {
                  id: teacher.id,
                  user_id: teacher.id,
                  name: teacher.name,
                  email: teacher.email,
                  phone: teacher.phone || null,
                  photo_url: null,
                  role: teacher.role || 'guru',
                  is_active: true,
                },
                user: { id: teacher.id },
                activeWorkspaceId: teacher.id
              })
              
              // Tarik data terbaru dari Cloud secara asinkron (tidak memblokir UI)
              import('@/lib/syncEngine').then(({ pullFromCloud }) => {
                pullFromCloud().then(() => console.log('Auto-pulled from cloud on login'))
              })

              return { error: null }
            }
          }

          return { error: 'Email atau password salah. Silakan coba lagi.' }
        } catch {
          return { error: 'Terjadi kesalahan. Silakan coba lagi.' }
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        set({ user: null, profile: null, activeWorkspaceId: null })
      },

      updateProfile: (updates) => {
        const current = get().profile
        if (current) set({ profile: { ...current, ...updates } })
      },

      setActiveWorkspaceId: (id) => {
        set({ activeWorkspaceId: id })
      },
    }),
    {
      name: 'tahfidz-mam-auth',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    }
  )
)

