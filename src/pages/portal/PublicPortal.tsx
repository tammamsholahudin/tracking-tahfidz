import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { validatePortalAccess } from '@/lib/portal'
import toast from 'react-hot-toast'

// Components
import PortalLogin from './components/PortalLogin'
import PortalLayout from './components/PortalLayout'
import WaliDashboard from './components/WaliDashboard'
import WaliProgress from './components/WaliProgress'
import WaliSetoran from './components/WaliSetoran'
import WaliAbsensi from './components/WaliAbsensi'
import WaliJurnal from './components/WaliJurnal'
import PortalDownload from './components/PortalDownload'
import PortalInfo from './components/PortalInfo'
import KepsekDashboard from './components/KepsekDashboard'

export default function PublicPortal() {
  const { linkId } = useParams()
  
  // Auth State
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogged, setIsLogged] = useState(false)
  
  // Data State
  const [portalMeta, setPortalMeta] = useState<any>(null)
  const [data, setData] = useState<any>(null) // holds { type, classes, etc }
  
  // Navigation State
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [loadingClass, setLoadingClass] = useState(false)

  const fetchClassData = async (classId: string) => {
    const { data: classData } = await supabase.from('school_classes').select('*').eq('id', classId).single()
    const { data: studentsData } = await supabase.from('students').select('*').eq('class_id', classId).order('name')
    const { data: meetingsData } = await supabase.from('meetings').select('*').eq('class_id', classId).order('date', { ascending: false })
    
    const meetingIds = meetingsData?.map(m => m.id) || []
    const studentIds = studentsData?.map(s => s.id) || []
    
    let attendanceData: any[] = []
    if (meetingIds.length > 0) {
      const { data: att } = await supabase.from('attendance_records').select('*').in('meeting_id', meetingIds)
      attendanceData = att || []
    }
    
    let memorizationData: any[] = []
    if (studentIds.length > 0) {
      const { data: mem } = await supabase.from('memorization_records').select('*').in('student_id', studentIds)
      memorizationData = mem || []
    }

    return {
      class_info: classData,
      students: studentsData || [],
      meetings: meetingsData || [],
      attendanceData,
      memorizationData
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !linkId) return
    setLoading(true)
    
    try {
      const res = await validatePortalAccess(linkId, password)
      
      if (!res.success) {
        toast.error(res.error || 'Akses ditolak')
        setLoading(false)
        return
      }
      
      setPortalMeta(res.data)
      const targetClasses = res.data.target_classes

      if (res.data.entity_type === 'wali_kelas') {
        const classId = targetClasses[0]
        const classFullData = await fetchClassData(classId)
        setData({
          type: 'wali_kelas',
          ...classFullData
        })
        setSelectedClassId(classId) // auto select the only class
      } else {
        // Kepala Sekolah - Load classes list first
        let query = supabase.from('school_classes').select('*').order('name')
        if (!targetClasses.includes('ALL')) {
          query = query.in('id', targetClasses)
        }
        const { data: classesData } = await query
        
        setData({
          type: 'kepala_sekolah',
          classes: classesData || []
        })
      }
      
      // Log visit
      await supabase.from('portal_access_logs').insert({
        portal_id: res.data.id,
        ip_address: 'Hidden',
        user_agent: navigator.userAgent
      })

      setIsLogged(true)
      toast.success('Berhasil masuk ke portal')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal mengambil data')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectClass = async (classId: string) => {
    setLoadingClass(true)
    try {
      // Append the specific class data into the existing data state
      const classFullData = await fetchClassData(classId)
      setData((prev: any) => ({
        ...prev,
        activeClassData: classFullData
      }))
      setSelectedClassId(classId)
      setActiveMenu('dashboard') // Reset to dashboard for that class
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data kelas')
    } finally {
      setLoadingClass(false)
    }
  }

  const handleBackToClasses = () => {
    setSelectedClassId(null)
    setActiveMenu('dashboard')
  }

  const handleLogout = () => {
    setIsLogged(false)
    setPassword('')
    setData(null)
    setPortalMeta(null)
    setSelectedClassId(null)
    setActiveMenu('dashboard')
  }

  if (!isLogged) {
    return (
      <PortalLogin 
        password={password} 
        setPassword={setPassword} 
        loading={loading} 
        onSubmit={handleLogin} 
      />
    )
  }

  // Get active data scope (if Kepsek is drilled down, use activeClassData, else use main data)
  const activeData = (data.type === 'kepala_sekolah' && selectedClassId) 
    ? { ...data.activeClassData, type: 'wali_kelas' } // Spoof type to render Wali components
    : data

  const renderActiveView = () => {
    if (loadingClass) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>Memuat data kelas...</div>
    }

    // Top-level Kepsek View
    if (data.type === 'kepala_sekolah' && !selectedClassId) {
      if (activeMenu === 'dashboard') return <KepsekDashboard data={data} onSelectClass={handleSelectClass} />
      if (activeMenu === 'info') return <PortalInfo portalMeta={portalMeta} />
      return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-gray-500)' }}>Pilih kelas terlebih dahulu untuk melihat menu ini.</div>
    }

    // Wali Kelas Views (or Kepsek drilled down)
    switch (activeMenu) {
      case 'dashboard': return <WaliDashboard data={activeData} />
      case 'progress': return <WaliProgress data={activeData} />
      case 'setoran': return <WaliSetoran data={activeData} />
      case 'absensi': return <WaliAbsensi data={activeData} />
      case 'jurnal': return <WaliJurnal data={activeData} />
      case 'download': return <PortalDownload data={activeData} />
      case 'info': return <PortalInfo portalMeta={portalMeta} />
      default: return <WaliDashboard data={activeData} />
    }
  }

  return (
    <PortalLayout
      portalMeta={portalMeta}
      data={data}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      onLogout={handleLogout}
      onBackToClasses={data.type === 'kepala_sekolah' ? handleBackToClasses : undefined}
      selectedClassId={selectedClassId}
    >
      {renderActiveView()}
    </PortalLayout>
  )
}
