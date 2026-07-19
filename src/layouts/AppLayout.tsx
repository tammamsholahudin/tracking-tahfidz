import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, School, BookOpen, Home, User, Settings,
  Database, Menu, X, LogOut, Search, ChevronRight, Trash2, AlertTriangle
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRealTimeClock } from '@/hooks/useRealTimeClock'
import { formatTanggal, formatWaktu } from '@/data/surahs'
import styles from './AppLayout.module.css'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { to: '/sekolah',   icon: <School size={20} />,          label: 'Sekolah' },
  { to: '/les',       icon: <BookOpen size={20} />,         label: 'Les' },
  { to: '/privat',    icon: <Home size={20} />,             label: 'Privat' },
  { to: '/profil',    icon: <User size={20} />,             label: 'Profil' },
  { to: '/pengaturan',icon: <Settings size={20} />,         label: 'Pengaturan' },
  { to: '/master',    icon: <Database size={20} />,         label: 'Master Data', adminOnly: true },
  { to: '/sampah',    icon: <Trash2 size={20} />,           label: 'Sampah' },
]

export default function AppLayout() {
  const { profile, activeWorkspaceId, setActiveWorkspaceId, logout } = useAuthStore()
  const navigate = useNavigate()
  const now = useRealTimeClock()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)
  
  const [offlineCount, setOfflineCount] = useState(0)

  useEffect(() => {
    const checkQueue = () => {
      const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]')
      setOfflineCount(queue.length)
    }
    checkQueue()
    window.addEventListener('offline_queue_updated', checkQueue)
    return () => window.removeEventListener('offline_queue_updated', checkQueue)
  }, [])
  
  const isAdminViewingOther = isAdmin && activeWorkspaceId && activeWorkspaceId !== profile?.id
  const [otherTeacherName, setOtherTeacherName] = useState('Guru')

  useEffect(() => {
    if (isAdminViewingOther) {
      try {
        const teachers = JSON.parse(localStorage.getItem('tahfidz_teachers') || '[]')
        const t = teachers.find((x: any) => x.id === activeWorkspaceId)
        if (t) setOtherTeacherName(t.name)
      } catch {}
    }
  }, [isAdminViewingOther, activeWorkspaceId])

  // RESCUE SCRIPT: Reassign orphaned data (e.g. if default admin was deleted) to the current admin
  useEffect(() => {
    if (isAdmin && profile?.id) {
      try {
        const teachers = JSON.parse(localStorage.getItem('tahfidz_teachers') || '[]')
        const validIds = new Set(teachers.map((t: any) => t.id))
        
        const rescueData = (key: string) => {
          const raw = localStorage.getItem(key)
          if (!raw) return
          const items = JSON.parse(raw)
          let changed = false
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              if (!item.guru_id || !validIds.has(item.guru_id)) {
                item.guru_id = profile.id
                changed = true
              }
            })
            if (changed) {
              localStorage.setItem(key, JSON.stringify(items))
              console.log(`[Rescue] Reassigned orphaned data in ${key} to ${profile.id}`)
            }
          }
        }

        const tables = [
          'tahfidz_classes', 'tahfidz_students', 'tahfidz_schedules', 
          'tahfidz_meetings', 'tahfidz_targets', 'tahfidz_lesson_groups', 
          'tahfidz_lesson_students', 'tahfidz_private_students'
        ]
        tables.forEach(rescueData)
      } catch (e) {
        console.error('Rescue script failed:', e)
      }
    }
  }, [isAdmin, profile?.id])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className={styles.nav}>
      {visibleItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.navActive : ''}`
          }
          onClick={onClick}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span className={styles.navLabel}>{item.label}</span>
          <ChevronRight size={14} className={styles.navChevron} />
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className={styles.layout}>
      {/* ── Sidebar Desktop ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <BookOpen size={22} color="white" />
          </div>
          <div className={styles.sidebarBrand}>
            <span className={styles.brandMain}>Tracking Tahfidz</span>
            <span className={styles.brandAccent}>MAM!</span>
          </div>
        </div>

        {/* Clock on sidebar */}
        <div className={styles.sidebarClock}>
          <div className={styles.clockTime}>{formatWaktu(now)}</div>
          <div className={styles.clockDate}>{formatTanggal(now)}</div>
        </div>

        <NavLinks />

        {/* Profile at bottom */}
        <div className={styles.sidebarFooter}>
          <div className={styles.profileRow}>
            <div className={styles.avatarSm}>
              {profile?.photo_url
                ? <img src={profile.photo_url} alt={profile.name} />
                : <span>{profile?.name?.charAt(0) ?? 'G'}</span>
              }
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{profile?.name ?? 'Guru'}</span>
              <span className={styles.profileRole}>
                {profile?.role === 'admin' ? '👑 Admin' : '📖 Guru'}
              </span>
            </div>
          </div>
          <button
            id="btn-logout"
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Keluar"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Bottom Navigation (Mobile) ── */}
      <nav className={styles.bottomNav}>
        {visibleItems.slice(0, 4).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.bottomItem} ${isActive ? styles.bottomActive : ''}`
            }
          >
            <span className={styles.bottomIcon}>{item.icon}</span>
            <span className={styles.bottomLabel}>{item.label}</span>
          </NavLink>
        ))}
        {/* 'More' button to open drawer on mobile for remaining items */}
        <button 
          className={styles.bottomItem} 
          onClick={() => setSidebarOpen(true)}
        >
          <span className={styles.bottomIcon}><Menu size={20} /></span>
          <span className={styles.bottomLabel}>Menu</span>
        </button>
      </nav>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          role="button"
          aria-label="Tutup menu"
        />
      )}

      {/* ── Mobile Drawer ── */}
      <aside className={`${styles.drawer} ${sidebarOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <div className={styles.sidebarBrand}>
            <span className={styles.brandMain}>Tracking Tahfidz</span>
            <span className={styles.brandAccent}>MAM!</span>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>
        <NavLinks onClick={() => setSidebarOpen(false)} />
        <div className={styles.sidebarFooter}>
          <div className={styles.profileRow}>
            <div className={styles.avatarSm}>
              {profile?.photo_url
                ? <img src={profile.photo_url} alt={profile.name} />
                : <span>{profile?.name?.charAt(0) ?? 'G'}</span>
              }
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{profile?.name ?? 'Guru'}</span>
              <span className={styles.profileRole}>{profile?.role === 'admin' ? '👑 Admin' : '📖 Guru'}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} /><span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className={styles.main}>
        {/* Global Header */}
        <header className={styles.header}>
          <button
            id="btn-menu-toggle"
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={22} />
          </button>
          <span className={styles.headerTitle}>Tracking Tahfidz MAM!</span>
          <button className={styles.searchBtn} aria-label="Cari">
            <Search size={20} />
          </button>
        </header>

        {/* Page Content */}
        <main className={styles.content}>
          {isAdminViewingOther && (
            <div className={styles.adminBanner}>
              <div className={styles.workspaceBanner} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} />
                  <span>Mode Admin: Melihat data <strong>{otherTeacherName}</strong></span>
                </div>
                <button 
                  onClick={() => setActiveWorkspaceId(profile?.id || null)}
                  style={{ background: 'white', color: '#b45309', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Kembali
                </button>
              </div>
            </div>
          )}

          {offlineCount > 0 && (
            <div style={{ background: '#fef3c7', color: '#b45309', padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 500 }}>
              <AlertTriangle size={14} />
              Menunggu sinkronisasi ({offlineCount} perubahan)
            </div>
          )}

          <Outlet />
        </main>        {/* ── Bottom Navigation (Mobile) ── */}
        <nav className={styles.bottomNav}>
          {visibleItems.slice(0, 5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.bottomItem} ${isActive ? styles.bottomActive : ''}`
              }
            >
              <span className={styles.bottomIcon}>{item.icon}</span>
              <span className={styles.bottomLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
