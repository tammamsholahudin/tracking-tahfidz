import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getSync } from '@/lib/db'
import styles from './Dashboard.module.css'

export default function AktivitasTerakhir() {
  const { activeWorkspaceId } = useAuthStore()
  const [activities, setActivities] = useState<any[]>([])
  
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  const formatActivityTime = (date: Date): string => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterday = today - 86400000
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    
    if (compareDate === today) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
    } else if (compareDate === yesterday) {
      return 'Kemarin ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
    } else {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  }

  useEffect(() => {
    const fetchActivities = () => {
      const localMems = getSync('tahfidz_memorization_records').filter((x:any) => x.guru_id === activeWorkspaceId)
      const localAtts = getSync('tahfidz_attendance_records').filter((x:any) => x.guru_id === activeWorkspaceId)
      
      const acts: any[] = []
      
      localMems.forEach((m: any) => {
        const date = new Date(m.created_at || m.date)
        acts.push({
          id: m.id || `act-mem-${date.getTime()}-${Math.random()}`,
          time: formatActivityTime(date),
          desc: `<strong>${m.student_name || 'Siswa'}</strong> setor ${m.surah_name || m.surah || ''} ${m.verse_start || ''}-${m.verse_end || ''}`,
          rawDate: date
        })
      })
      
      localAtts.forEach((a: any) => {
        if (a.status !== 'hadir') {
          const date = new Date(a.created_at || a.date)
          const statusLabel = a.status === 'izin' ? 'Izin' : a.status === 'sakit' ? 'Sakit' : 'Belum Hadir'
          acts.push({
            id: a.id || `act-att-${date.getTime()}-${Math.random()}`,
            time: formatActivityTime(date),
            desc: `<strong>${a.student_name || 'Siswa'}</strong> ditandai ${statusLabel}`,
            rawDate: date
          })
        }
      })
      
      acts.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
      setActivities(acts)
    }

    fetchActivities()
    window.addEventListener('local_cache_updated', fetchActivities)
    return () => window.removeEventListener('local_cache_updated', fetchActivities)
  }, [activeWorkspaceId, now])

  return (
    <div className={`${styles.page} page-enter`}>
      <div style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Link to="/dashboard" style={{ color: 'var(--clr-gray-500)', display: 'flex', padding: '8px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>Aktivitas Terakhir</h1>
        </div>

        <div className={styles.widgetCard} style={{ minHeight: '60vh' }}>
          <div className={styles.activityLog}>
            {activities.length === 0 ? (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-gray-400)', padding: 'var(--space-4) 0', textAlign: 'center' }}>
                Belum ada aktivitas yang terekam.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className={styles.actItem} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--clr-gray-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Clock size={14} color="var(--clr-gray-400)" />
                    <span className={styles.actTime} style={{ margin: 0, fontWeight: 'bold', color: 'var(--clr-gray-500)' }}>{act.time}</span>
                  </div>
                  <span className={styles.actDesc} style={{ fontSize: 'var(--text-md)' }} dangerouslySetInnerHTML={{ __html: act.desc }} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
