import { useState, useEffect } from 'react'

import { CheckCircle2, XCircle, Trophy, BookOpen, Clock } from 'lucide-react'
import { calculateStudentProgress, calculateClassProgress, getStatusLabel, getStatusColor, type TargetHafalan } from '@/lib/progressEngine'
import styles from './ClassProgress.module.css'

export default function ClassProgressPage({ entityId, entityType = 'sekolah' }: { entityId: string, entityType?: string, entityData?: any }) {
  const [students, setStudents] = useState<any[]>([])
  const [targets, setTargets] = useState<TargetHafalan[]>([])
  const [records, setRecords] = useState<any[]>([])
  
  useEffect(() => {
    // Load data from localStorage
    let activeStudents = []
    if (entityType === 'sekolah') {
      const allStudents = JSON.parse(localStorage.getItem('tahfidz_students') || '[]')
      activeStudents = allStudents.filter((s: any) => s.class_id === entityId && s.name)
    } else if (entityType === 'les') {
      const allLessonStudents = JSON.parse(localStorage.getItem('tahfidz_lesson_students') || '[]')
      activeStudents = allLessonStudents.filter((s: any) => s.group_id === entityId)
    } else if (entityType === 'privat') {
      const allPrivates = JSON.parse(localStorage.getItem('tahfidz_private_students') || '[]')
      const p = allPrivates.find((x: any) => x.id === entityId)
      if (p) activeStudents = [p]
    }
    setStudents(activeStudents)
    
    const allTargets = JSON.parse(localStorage.getItem('tahfidz_targets') || '[]')
    setTargets(allTargets.filter((t: any) => 
      entityType === 'sekolah' ? t.class_id === entityId : t.entity_id === entityId
    ))
    
    const allMem = JSON.parse(localStorage.getItem('tahfidz_memorization_records') || '[]')
    setRecords(allMem.filter((m: any) => 
      entityType === 'sekolah' ? m.class_id === entityId : m.entity_id === entityId
    ))
  }, [entityId, entityType])

  // Calculate progress for each student
  const studentProgress = students.map(s => {
    const prog = calculateStudentProgress(s.id, targets, records)
    return { ...s, ...prog }
  })

  // Group students by status
  const categorized = {
    tercapai: studentProgress.filter(s => s.status === 'tercapai'),
    hampir: studentProgress.filter(s => s.status === 'hampir_tercapai'),
    proses: studentProgress.filter(s => s.status === 'dalam_proses'),
    awal: studentProgress.filter(s => s.status === 'tahap_awal'),
    belum: studentProgress.filter(s => s.status === 'belum_mulai'),
  }

  const classProgress = calculateClassProgress(students, targets, records)

  if (targets.length === 0) {
    return (
      <div className={styles.wrap} style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px' }}>
        <BookOpen size={48} color="var(--clr-gray-300)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ color: 'var(--clr-gray-700)' }}>Target Hafalan Belum Diatur</h3>
        <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px', marginTop: '8px' }}>
          Silakan atur target hafalan terlebih dahulu di tab <strong>Target Hafalan</strong> untuk melihat progress siswa.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {/* Summary */}
      <div className={styles.summaryRow}>
        <div className={`${styles.summBox} ${styles.green}`}>
          <Trophy size={20} />
          <div className={styles.summVal}>{categorized.tercapai.length}</div>
          <div className={styles.summLabel}>Target Tercapai</div>
        </div>
        <div className={`${styles.summBox} ${styles.blue}`}>
          <CheckCircle2 size={20} />
          <div className={styles.summVal}>{categorized.hampir.length}</div>
          <div className={styles.summLabel}>Hampir Tercapai</div>
        </div>
        <div className={`${styles.summBox} ${styles.yellow}`}>
          <Clock size={20} />
          <div className={styles.summVal}>{categorized.proses.length + categorized.awal.length}</div>
          <div className={styles.summLabel}>Dalam Proses</div>
        </div>
        <div className={`${styles.summBox} ${styles.red}`}>
          <XCircle size={20} />
          <div className={styles.summVal}>{categorized.belum.length}</div>
          <div className={styles.summLabel}>Belum Mulai</div>
        </div>
      </div>

      {/* Target info */}
      <div className={styles.targetCard}>
        <div className={styles.targetLabel}>Rata-rata Progress Target Hafalan Kelas</div>
        <div className={styles.targetProgress}>
          <div className={styles.targetBar}>
            <div className={styles.targetFill} style={{ width: `${classProgress}%` }} />
          </div>
          <span>{classProgress}%</span>
        </div>
      </div>

      {/* Student progress table */}
      {[
        { label: 'Target Tercapai', color: getStatusColor('tercapai'), students: categorized.tercapai },
        { label: 'Hampir Tercapai', color: getStatusColor('hampir_tercapai'), students: categorized.hampir },
        { label: 'Dalam Proses', color: getStatusColor('dalam_proses'), students: categorized.proses },
        { label: 'Tahap Awal', color: getStatusColor('tahap_awal'), students: categorized.awal },
        { label: 'Belum Mulai', color: getStatusColor('belum_mulai'), students: categorized.belum },
      ].map(group => (
        group.students.length > 0 && (
          <div key={group.label} className={styles.groupCard}>
            <h3 className={styles.groupTitle} style={{ color: group.color }}>{group.label}</h3>
            {group.students.map((s: any) => (
              <div key={s.id} className={styles.studentRow}>
                <div className={styles.avatar}>{(s.name || '?').charAt(0).toUpperCase()}</div>
                <div className={styles.info}>
                  <span className={styles.name}>{s.name}</span>
                  <span className={styles.surah}>
                    {s.suratSelesai} dari {s.suratTarget} Surat selesai
                  </span>
                </div>
                <div className={styles.progWrap}>
                  <div className={styles.progBar}>
                    <div
                      className={styles.progFill}
                      style={{
                        width: `${s.pct}%`,
                        background: group.color,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span className={styles.progPct} style={{ color: group.color }}>{s.pct}%</span>
                    <span style={{ fontSize: '10px', color: 'var(--clr-gray-500)', fontWeight: 600, marginTop: '2px' }}>{getStatusLabel(s.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  )
}
