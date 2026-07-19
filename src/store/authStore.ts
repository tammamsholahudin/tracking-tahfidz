import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

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
  institution_name?: string | null
  institution_subtitle?: string | null
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
  updateProfile: (updates: Partial<TeacherProfile>) => Promise<void>
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
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) throw error
          
          if (session) {
            const { data: teacher, error: teacherError } = await supabase
              .from('teachers')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
              
            if (!teacherError && teacher) {
              set({
                user: { id: session.user.id },
                profile: teacher as TeacherProfile,
                activeWorkspaceId: get().activeWorkspaceId || teacher.id
              })
            } else {
              set({ user: null, profile: null, activeWorkspaceId: null })
            }
          } else {
            set({ user: null, profile: null, activeWorkspaceId: null })
          }
          
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              const { data: teacher } = await supabase
                .from('teachers')
                .select('*')
                .eq('user_id', session.user.id)
                .single()
                
              if (teacher) {
                set({
                  user: { id: session.user.id },
                  profile: teacher as TeacherProfile,
                  activeWorkspaceId: teacher.id
                })
              }
            } else if (event === 'SIGNED_OUT') {
              set({ user: null, profile: null, activeWorkspaceId: null })
            }
          })
          
        } catch (err) {
          console.error('Auth init error:', err)
        } finally {
          set({ isLoading: false, isInitialized: true })
        }
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (error) {
            return { error: 'Email atau password salah. Silakan coba lagi.' }
          }
          return { error: null }
        } catch {
          return { error: 'Terjadi kesalahan. Silakan coba lagi.' }
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, activeWorkspaceId: null })
      },

      updateProfile: async (updates) => {
        const current = get().profile
        if (current) {
          // Update Supabase
          const { error } = await supabase.from('teachers').update(updates).eq('id', current.id)
          if (!error) {
            // Update local state if successful
            set({ profile: { ...current, ...updates } })
          } else {
            console.error('Failed to update profile in Supabase:', error)
          }
        }
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


