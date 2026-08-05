import React, { useState, useEffect } from 'react'
import { LayoutDashboard, TrendingUp, BookOpen, Calendar, BookMarked, Download as DownloadIcon, Info, LogOut, Menu, X, ArrowLeft } from 'lucide-react'

interface PortalLayoutProps {
  portalMeta: any
  data: any
  children: React.ReactNode
  activeMenu: string
  setActiveMenu: (menu: string) => void
  onLogout: () => void
  onBackToClasses?: () => void
  selectedClassId?: string | null
}

const MENUS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'progress', label: 'Progress Hafalan', icon: TrendingUp },
  { id: 'setoran', label: 'Setoran Hafalan', icon: BookOpen },
  { id: 'absensi', label: 'Absensi Siswa', icon: Calendar },
  { id: 'jurnal', label: 'Jurnal Belajar', icon: BookMarked },
  { id: 'download', label: 'Download Laporan', icon: DownloadIcon },
  { id: 'info', label: 'Informasi Portal', icon: Info },
]

export default function PortalLayout({ portalMeta, data, children, activeMenu, setActiveMenu, onLogout, onBackToClasses, selectedClassId }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const currentClass = data?.type === 'wali_kelas' 
    ? data.class_info 
    : data?.classes?.find((c: any) => c.id === selectedClassId)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--clr-gray-50)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }} 
        />
      )}

      {/* Sidebar */}
      <aside style={{ 
        position: isMobile ? 'fixed' : 'sticky', 
        top: 0,
        left: 0,
        height: '100vh', 
        width: '280px', 
        background: '#fff', 
        borderRight: '1px solid var(--clr-gray-200)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none'
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--clr-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--clr-primary)', letterSpacing: '-0.5px' }}>Tracking Tahfidz</h2>
            <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', fontWeight: 500 }}>Portal Read-Only</div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--clr-gray-500)' }}>
              <X size={24} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {onBackToClasses && selectedClassId && (
            <button 
              onClick={onBackToClasses}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'var(--clr-gray-100)', color: 'var(--clr-gray-700)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px' }}
            >
              <ArrowLeft size={18} />
              Kembali ke Daftar Kelas
            </button>
          )}

          {MENUS.map(menu => (
            <button
              key={menu.id}
              onClick={() => {
                setActiveMenu(menu.id)
                if (isMobile) setSidebarOpen(false)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none',
                background: activeMenu === menu.id ? 'var(--clr-primary-50)' : 'transparent',
                color: activeMenu === menu.id ? 'var(--clr-primary)' : 'var(--clr-gray-600)',
                fontSize: '14px', fontWeight: activeMenu === menu.id ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <menu.icon size={18} strokeWidth={activeMenu === menu.id ? 2.5 : 2} />
              {menu.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--clr-gray-100)' }}>
          <button 
            onClick={onLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
          >
            <LogOut size={18} />
            Keluar Portal
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        
        {/* Topbar */}
        <header style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--clr-gray-200)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 30 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--clr-gray-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Menu size={24} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--clr-gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {portalMeta?.portal_name}
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--clr-gray-500)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentClass ? `Kelas ${currentClass.name}` : (data?.type === 'kepala_sekolah' ? 'Dashboard Kepala Sekolah' : 'Portal')}
              {currentClass && <span style={{ padding: '2px 8px', background: 'var(--clr-primary-50)', color: 'var(--clr-primary)', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>Wali: {currentClass.homeroom_teacher || '-'}</span>}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, padding: isMobile ? '20px' : '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>

    </div>
  )
}
