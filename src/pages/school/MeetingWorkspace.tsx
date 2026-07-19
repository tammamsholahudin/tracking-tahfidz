import { useState, useEffect, useRef } from 'react'
import { BookOpen, CheckCircle2, UserCheck, CheckSquare, ListTodo, AlertTriangle, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import { SURAHS } from '@/data/surahs'
import { getJuzFromSurah } from '@/lib/progressEngine'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import styles from './MeetingWorkspace.module.css'

interface MeetingWorkspaceProps { entityId: string, entityType?: string, entityName?: string }
type AttStatus = 'hadir' | 'izin' | 'sakit' | 'alpa'

const MEM_STATUS_OPTIONS = [
  { value: 'sangat_lancar',  label: 'Sangat Lancar' },
  { value: 'lancar',         label: 'Lancar' },
  { value: 'cukup_lancar',   label: 'Cukup Lancar' },
  { value: 'perlu_murojaah', label: 'Perlu Murojaah' },
  { value: 'ulangi',         label: 'Ulangi' },
  { value: 'belum_lancar',   label: 'Belum Lancar' },
]

export default function MeetingWorkspace({ entityId, entityType = 'sekolah' }: MeetingWorkspaceProps) {
  const { activeWorkspaceId } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'absensi' | 'setoran' | 'ringkasan'>('absensi')
  const [students, setStudents] = useState<any[]>([])
  
  // Meeting state
  const [meetingNotes, setMeetingNotes] = useState('')
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>({})
  const [memorizations, setMemorizations] = useState<Record<string, any>>({})
  
  // Draft state
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null)
  const isInitialized = useRef(false)

  // Setoran Tab state
  const [showAllSetoran, setShowAllSetoran] = useState(false)
  const [activeSetoranForm, setActiveSetoranForm] = useState<string | null>(null) // studentId
  const [tempSetoran, setTempSetoran] = useState<any>({})

  const draftKey = `tahfidz_meeting_draft_${entityId}`

  useEffect(() => {
    let activeStudents = []
    if (entityType === 'sekolah') {
      const allLocalStudents = JSON.parse(localStorage.getItem('tahfidz_students') || '[]')
      activeStudents = allLocalStudents.filter((s: any) => s.class_id === entityId && s.name)
    } else if (entityType === 'les') {
      const allLessonStudents = JSON.parse(localStorage.getItem('tahfidz_lesson_students') || '[]')
      activeStudents = allLessonStudents.filter((s: any) => s.group_id === entityId)
    } else if (entityType === 'privat') {
      const allPrivates = JSON.parse(localStorage.getItem('tahfidz_private_students') || '[]')
      const p = allPrivates.find((x: any) => x.id === entityId)
      if (p) activeStudents = [p]
    }
    setStudents(activeStudents)

    const draftStr = localStorage.getItem(draftKey)
    if (draftStr) {
      try {
        const draftData = JSON.parse(draftStr)
        setDraftTimestamp(draftData.timestamp ?? null)
      } catch { /* ignore */ }
      setShowDraftDialog(true)
    } else {
      // Initialize default
      const initAtt: Record<string, AttStatus> = {}
      activeStudents.forEach((s: any) => { initAtt[s.id] = 'hadir' })
      setAttendance(initAtt)
      isInitialized.current = true
    }
  }, [entityId, entityType])

  // Auto Save
  useEffect(() => {
    if (!isInitialized.current) return
    const draftData = {
      attendance,
      memorizations,
      meetingNotes,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(draftKey, JSON.stringify(draftData))
  }, [attendance, memorizations, meetingNotes])

  const handleResumeDraft = () => {
    const draftStr = localStorage.getItem(draftKey)
    if (draftStr) {
      const data = JSON.parse(draftStr)
      setAttendance(data.attendance || {})
      setMemorizations(data.memorizations || {})
      setMeetingNotes(data.meetingNotes || '')
    }
    setShowDraftDialog(false)
    isInitialized.current = true
    toast.success('Draft berhasil dimuat')
  }

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey)
    const initAtt: Record<string, AttStatus> = {}
    students.forEach((s: any) => { initAtt[s.id] = 'hadir' })
    setAttendance(initAtt)
    setMemorizations({})
    setMeetingNotes('')
    setShowDraftDialog(false)
    isInitialized.current = true
    toast.success('Draft dihapus, memulai pertemuan baru')
  }

  const markAllHadir = () => {
    const newAtt = { ...attendance }
    students.forEach(s => { newAtt[s.id] = 'hadir' })
    setAttendance(newAtt)
    toast.success('Semua diset Hadir')
  }

  const resetAttendance = () => {
    const newAtt = { ...attendance }
    students.forEach(s => { newAtt[s.id] = 'alpa' })
    setAttendance(newAtt)
    toast.success('Absensi di-reset')
  }

  const openSetoranForm = (studentId: string) => {
    const existing = memorizations[studentId]
    if (existing) {
      setTempSetoran(existing)
    } else {
      setTempSetoran({
        surah_id: 78,
        verse_start: 1,
        verse_end: 5,
        status: 'lancar',
        score: 85,
        note: ''
      })
    }
    setActiveSetoranForm(studentId)
  }

  const saveSetoran = (studentId: string) => {
    const surah = SURAHS.find(s => s.number === Number(tempSetoran.surah_id))
    const totalVerses = surah ? surah.total_verses : 0
    const start = Number(tempSetoran.verse_start)
    const end = Number(tempSetoran.verse_end)
    
    if (end > totalVerses) {
      toast.error(`Ayat akhir melebihi jumlah ayat pada Surat ${surah?.name_latin}.\nJumlah ayat Surat ${surah?.name_latin} adalah ${totalVerses} ayat.`)
      return
    }
    if (start > totalVerses) {
      toast.error(`Ayat awal melebihi jumlah ayat pada Surat ${surah?.name_latin}.`)
      return
    }
    if (start > end) {
      toast.error('Ayat awal tidak boleh lebih besar daripada ayat akhir.')
      return
    }

    setMemorizations(prev => ({
      ...prev,
      [studentId]: {
        ...tempSetoran,
        surah_name: surah?.name_latin,
        juz: surah ? getJuzFromSurah(surah.number) : 30
      }
    }))
    setActiveSetoranForm(null)
    toast.success('Setoran tersimpan ke draft')
  }

  const handleFinishMeeting = () => {
    if (!confirm('Akhiri pertemuan dan simpan semua data secara permanen?')) return

    const meetingId = `mtg-${Date.now()}`
    const meetingDate = new Date().toISOString()
    
    // Save Meeting
    const newMeeting = {
      id: meetingId,
      entity_id: entityId,
      entity_type: entityType,
      class_id: entityType === 'sekolah' ? entityId : null,
      guru_id: activeWorkspaceId,
      date: meetingDate,
      notes: meetingNotes,
      total_students: students.length
    }
    const allMeetings = JSON.parse(localStorage.getItem('tahfidz_meetings') || '[]')
    localStorage.setItem('tahfidz_meetings', JSON.stringify([...allMeetings, newMeeting]))

    // Save Attendance
    const allAtt = JSON.parse(localStorage.getItem('tahfidz_attendance_records') || '[]')
    const newAttRecords = students.map(s => ({
      id: `att-${Date.now()}-${s.id}`,
      meeting_id: meetingId,
      entity_id: entityId,
      entity_type: entityType,
      class_id: entityType === 'sekolah' ? entityId : null,
      guru_id: activeWorkspaceId,
      student_id: s.id,
      student_name: s.name,
      status: attendance[s.id] || 'alpa',
      date: meetingDate
    }))
    localStorage.setItem('tahfidz_attendance_records', JSON.stringify([...allAtt, ...newAttRecords]))

    // Save Memorizations
    const allMem = JSON.parse(localStorage.getItem('tahfidz_memorization_records') || '[]')
    const newMemRecords = Object.keys(memorizations).map(studentId => {
      const m = memorizations[studentId]
      const s = students.find(st => st.id === studentId)
      return {
        id: `mem-${Date.now()}-${studentId}`,
        meeting_id: meetingId,
        entity_id: entityId,
        entity_type: entityType,
        class_id: entityType === 'sekolah' ? entityId : null,
        guru_id: activeWorkspaceId,
        student_id: studentId,
        student_name: s?.name,
        date: meetingDate,
        ...m
      }
    })
    
    if (newMemRecords.length > 0) {
      localStorage.setItem('tahfidz_memorization_records', JSON.stringify([...allMem, ...newMemRecords]))
    }

    localStorage.removeItem(draftKey) // Clean up draft
    toast.success('Pertemuan Selesai! Data berhasil disimpan.', { icon: '✅' })
    
    // Reset to start
    setMeetingNotes('')
    setMemorizations({})
    const initAtt: Record<string, AttStatus> = {}
    students.forEach((s: any) => { initAtt[s.id] = 'hadir' })
    setAttendance(initAtt)
    setActiveTab('absensi')
  }

  const setoranStudents = showAllSetoran 
    ? students 
    : students.filter(s => attendance[s.id] === 'hadir')

  const totalHadir = Object.values(attendance).filter(v => v === 'hadir').length
  const totalIzin = Object.values(attendance).filter(v => v === 'izin').length
  const totalSakit = Object.values(attendance).filter(v => v === 'sakit').length
  const totalAlpa = Object.values(attendance).filter(v => v === 'alpa').length
  const totalSetoran = Object.keys(memorizations).length

  return (
    <div className={styles.wrap}>
      {/* Draft Banner — non-intrusive, stays above workspace */}
      {showDraftDialog && (
        <div className={styles.draftBanner}>
          <div className={styles.draftBannerLeft}>
            <AlertTriangle size={16} className={styles.draftIcon} />
            <div>
              <strong>Draf ditemukan</strong>
              {draftTimestamp && (
                <span className={styles.draftTime}>
                  {' '}— disimpan {new Date(draftTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <div className={styles.draftBannerBtns}>
            <button className={styles.draftBtnDiscard} onClick={handleDiscardDraft}>Buang</button>
            <button className={styles.draftBtnResume} onClick={handleResumeDraft}>Lanjutkan</button>
          </div>
        </div>
      )}

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'absensi' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('absensi')}
        >
          1. Absensi
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'setoran' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('setoran')}
        >
          2. Setoran Hafalan
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'ringkasan' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('ringkasan')}
        >
          3. Ringkasan
        </button>
      </div>

      {activeTab === 'absensi' && (
        <div className={styles.card}>
          <div className={styles.header}>
            <h3 className={styles.title}><UserCheck size={18} /> Kehadiran Siswa</h3>
            <div className={styles.btnGroup}>
              <button className={styles.btnAction} onClick={resetAttendance}>Reset</button>
              <button className={styles.btnAction} onClick={markAllHadir} style={{ color: 'var(--clr-success)' }}>
                <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 4 }}/> Hadir Semua
              </button>
            </div>
          </div>
          
          <div className={styles.studentList}>
            {students.length === 0 && <div style={{ textAlign: 'center', padding: 20 }}>Belum ada siswa.</div>}
            {students.map(s => (
              <div key={s.id} className={styles.studentRow}>
                <div className={styles.studentHeader}>
                  <div className={styles.studentInfo}>
                    <div className={styles.avatar}>{(s.name || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <div className={styles.studentName}>{s.name}</div>
                      <div className={styles.studentNis}>{s.nis}</div>
                    </div>
                  </div>
                  <div className={styles.attBtns}>
                    {(['hadir', 'izin', 'sakit', 'alpa'] as AttStatus[]).map(status => (
                      <button
                        key={status}
                        className={styles.attBtn}
                        data-active={attendance[s.id] === status}
                        data-status={status}
                        onClick={() => setAttendance(p => ({ ...p, [s.id]: status }))}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.stepperActions}>
            <button className={styles.btnNextStep} onClick={() => setActiveTab('setoran')}>
              Lanjut ke Setoran Hafalan <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'setoran' && (
        <div className={styles.card}>
          <div className={styles.header}>
            <h3 className={styles.title}><BookOpen size={18} /> Setoran Hafalan</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)' }}>
              <input 
                type="checkbox" 
                checked={showAllSetoran} 
                onChange={(e) => setShowAllSetoran(e.target.checked)} 
              />
              Tampilkan Semua Siswa
            </label>
          </div>

          <div className={styles.studentList}>
            {setoranStudents.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20 }}>Tidak ada siswa yang hadir.</div>
            )}
            {setoranStudents.map(s => {
              const isEditing = activeSetoranForm === s.id
              const mem = memorizations[s.id]

              return (
                <div key={s.id} className={styles.studentRow}>
                  <div className={styles.studentHeader}>
                    <div className={styles.studentInfo}>
                      <div className={styles.avatar}>{(s.name || '?').charAt(0).toUpperCase()}</div>
                      <div>
                        <div className={styles.studentName}>{s.name}</div>
                        {mem ? (
                          <div style={{ fontSize: '12px', color: 'var(--clr-primary-600)', fontWeight: 600 }}>
                            {mem.surah_name} ({mem.verse_start}-{mem.verse_end}) • {mem.score}
                          </div>
                        ) : (
                          <div className={styles.studentNis}>Belum Setor</div>
                        )}
                      </div>
                    </div>
                    <button 
                      className={styles.btnAction} 
                      onClick={() => isEditing ? setActiveSetoranForm(null) : openSetoranForm(s.id)}
                      style={{ color: mem ? 'var(--clr-success)' : 'inherit', borderColor: mem ? 'var(--clr-success)' : 'inherit' }}
                    >
                      {mem ? <><CheckCircle2 size={14} style={{ display: 'inline', marginRight: 4 }}/> Edit Setoran</> : 'Input Setoran'}
                      {isEditing ? <ChevronUp size={14} style={{ display: 'inline', marginLeft: 4 }}/> : <ChevronDown size={14} style={{ display: 'inline', marginLeft: 4 }}/>}
                    </button>
                  </div>

                  {isEditing && (
                    <div className={styles.setoranForm}>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Surat</label>
                        <select 
                          className="form-select" 
                          value={tempSetoran.surah_id} 
                          onChange={e => {
                            const sid = Number(e.target.value)
                            setTempSetoran({...tempSetoran, surah_id: sid})
                          }}
                        >
                          {SURAHS.map(surah => (
                            <option key={surah.number} value={surah.number}>
                              {surah.number}. {surah.name_latin}
                            </option>
                          ))}
                        </select>
                        <div style={{ fontSize: 11, color: 'var(--clr-primary-700)', marginTop: 4, fontWeight: 500 }}>
                          📖 Jumlah Ayat: {SURAHS.find(s => s.number === Number(tempSetoran.surah_id))?.total_verses} Ayat
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Ayat Awal</label>
                        <input type="number" className="form-input" value={tempSetoran.verse_start} onChange={e => setTempSetoran({...tempSetoran, verse_start: e.target.value})} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Ayat Akhir</label>
                        <input type="number" className="form-input" value={tempSetoran.verse_end} onChange={e => setTempSetoran({...tempSetoran, verse_end: e.target.value})} />
                      </div>
                      
                      <div style={{ gridColumn: '1 / -1', marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--clr-primary-700)', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={tempSetoran.surat_selesai || false} 
                            onChange={e => {
                              const checked = e.target.checked
                              const sData = SURAHS.find(s => s.number === Number(tempSetoran.surah_id))
                              if (checked && sData) {
                                setTempSetoran({...tempSetoran, surat_selesai: true, verse_start: 1, verse_end: sData.total_verses})
                              } else {
                                setTempSetoran({...tempSetoran, surat_selesai: checked})
                              }
                            }}
                            style={{ width: 16, height: 16 }}
                          />
                          ✓ Hafal 1 Surat Penuh
                        </label>
                        <div style={{ fontSize: 11, color: 'var(--clr-gray-500)', marginTop: 4, marginLeft: 22 }}>
                          Centang apabila siswa telah menyelesaikan hafalan satu surat penuh. Progress target hafalan kelas hanya akan bertambah jika ini dicentang.
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Status Hafalan</label>
                        <select 
                          className="form-select" 
                          value={tempSetoran.status} 
                          onChange={e => setTempSetoran({...tempSetoran, status: e.target.value})}
                        >
                          {MEM_STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Nilai (0-100)</label>
                        <input type="number" min="0" max="100" className="form-input" value={tempSetoran.score} onChange={e => setTempSetoran({...tempSetoran, score: e.target.value})} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Catatan Guru</label>
                        <input type="text" className="form-input" placeholder="Contoh: Makharij perlu diperbaiki" value={tempSetoran.note} onChange={e => setTempSetoran({...tempSetoran, note: e.target.value})} />
                      </div>

                      <div className={styles.setoranActions}>
                        <button className={styles.btnAction} onClick={() => setActiveSetoranForm(null)}>Batal</button>
                        <button 
                          className={styles.btnAction} 
                          style={{ background: 'var(--clr-primary-600)', color: 'white', borderColor: 'var(--clr-primary-600)' }}
                          onClick={() => saveSetoran(s.id)}
                        >
                          Simpan Draft Setoran
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className={styles.stepperActions}>
            <button className={styles.btnPrevStep} onClick={() => setActiveTab('absensi')}>
              Kembali ke Absensi
            </button>
            <button className={styles.btnNextStep} onClick={() => setActiveTab('ringkasan')}>
              Lanjut ke Ringkasan <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'ringkasan' && (
        <div className={styles.card}>
          <div className={styles.header}>
            <h3 className={styles.title}><ListTodo size={18} /> Ringkasan Pertemuan</h3>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statVal}>{totalHadir}</div>
              <div className={styles.statLabel}>Hadir</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statVal}>{totalIzin + totalSakit}</div>
              <div className={styles.statLabel}>Izin / Sakit</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statVal} style={{ color: 'var(--clr-danger)' }}>{totalAlpa}</div>
              <div className={styles.statLabel}>Alpha</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statVal} style={{ color: 'var(--clr-success)' }}>{totalSetoran}</div>
              <div className={styles.statLabel}>Sudah Setor</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan Umum Pertemuan</label>
            <textarea
              className="form-textarea"
              placeholder="Contoh: Pembelajaran kondusif, 5 siswa belum setoran karena waktu habis..."
              value={meetingNotes}
              onChange={e => setMeetingNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-6)', marginBottom: 'var(--space-2)' }}>
            <button className={styles.btnPrimary} style={{ padding: '16px 32px', fontSize: 'var(--text-lg)' }} onClick={handleFinishMeeting}>
              <CheckSquare size={24} /> Selesaikan Pertemuan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
