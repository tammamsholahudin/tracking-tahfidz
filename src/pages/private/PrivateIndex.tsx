import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, TrendingUp, ChevronRight, Target, Calendar, CheckCircle2, AlertCircle, CheckCircle } from 'lucide-react'
import AddPrivateModal from '@/components/AddPrivateModal'
import { useAuthStore } from '@/store/authStore'
import FabMenu from '@/components/FabMenu'
import styles from '../school/SchoolIndex.module.css'

interface PrivateData {
  id: string
  name: string
  progress: number
  target: string
  target_count: number
  meeting_count: number
  has_schedule: boolean
  payment_status: 'paid' | 'unpaid'
}

export default function PrivateIndex() {
  const { activeWorkspaceId } = useAuthStore()
  const [showAdd, setShowAdd] = useState(false)
  const [students, setStudents] = useState<PrivateData[]>([])

  const fetchStudents = () => {
    const localStudents = JSON.parse(localStorage.getItem('tahfidz_private_students') || '[]').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localTargets = JSON.parse(localStorage.getItem('tahfidz_targets') || '[]').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localMeetings = JSON.parse(localStorage.getItem('tahfidz_meetings') || '[]').filter((x:any) => x.guru_id === activeWorkspaceId)
    const localSchedules = JSON.parse(localStorage.getItem('tahfidz_schedules') || '[]').filter((x:any) => x.guru_id === activeWorkspaceId)

    const mappedLocal = localStudents.map((s: any) => {
      const targetCount = localTargets.filter((t: any) => t.entity_id === s.id && t.entity_type === 'privat').length
      const meetingCount = localMeetings.filter((m: any) => m.entity_id === s.id && m.entity_type === 'privat').length
      const hasSchedule = localSchedules.some((sch: any) => sch.entity_id === s.id && sch.entity_type === 'privat')

      return {
        ...s,
        target_count: targetCount,
        meeting_count: meetingCount,
        has_schedule: hasSchedule,
        target: s.target || 'Belum diatur',
        progress: s.progress || 0,
        payment_status: s.payment_status || 'unpaid'
      }
    })
    setStudents(mappedLocal)
  }

  useEffect(() => {
    fetchStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId])

  return (
    <>
      <div className="page-enter">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Santri Privat</h1>
          <p className={styles.subtitle}>Kelola program hafalan intensif (1 on 1)</p>
        </div>
      </div>

      <div className="content-area">
        <div className={styles.grid}>
          {students.map(s => (
            <Link to={`/privat/${s.id}`} key={s.id} className={styles.classCard}>
              <div className={styles.classContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <div>
                    <h2 className={styles.className}>{s.name}</h2>
                  </div>
                </div>

                <div className={styles.classGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Target Individu</span>
                    <span className={styles.metaValue}><Target size={14} /> {s.target_count} Surat</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Pertemuan</span>
                    <span className={styles.metaValue}><Calendar size={14} /> {s.meeting_count} Pertemuan</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Status Jadwal</span>
                    <span className={styles.metaValue} style={{ color: s.has_schedule ? 'var(--clr-success)' : 'var(--clr-warning)' }}>
                      {s.has_schedule ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} 
                      {s.has_schedule ? 'Sudah Diatur' : 'Belum Diatur'}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Status Pembayaran</span>
                    <span className={styles.metaValue} style={{ color: s.payment_status === 'paid' ? 'var(--clr-success)' : 'var(--clr-danger)' }}>
                      {s.payment_status === 'paid' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} 
                      {s.payment_status === 'paid' ? 'Sudah Bayar' : 'Belum Bayar'}
                    </span>
                  </div>
                </div>

                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                  <span className={styles.progressPct}>{s.progress}%</span>
                </div>
                <span className={styles.progressLabel}>
                  <TrendingUp size={12} /> Progress Hafalan
                </span>
              </div>
              <ChevronRight size={20} className={styles.arrow} />
            </Link>
          ))}
        </div>

        {students.length === 0 && (
          <div className={styles.empty}>
            <User size={48} opacity={0.3} />
            <p>Tidak ada santri privat ditemukan</p>
          </div>
        )}
      </div>

      {showAdd && (
        <AddPrivateModal 
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            fetchStudents()
          }}
        />
      )}
      </div>

      <FabMenu 
        actions={[{ id: 'tambah-privat', label: 'Tambah Santri', icon: <User size={16} /> }]} 
        onAction={(action) => {
          if (action === 'tambah-privat') setShowAdd(true)
        }} 
      />
    </>
  )
}
