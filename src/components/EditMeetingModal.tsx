import { useState, useEffect } from 'react'
import { X, Calendar, ClipboardList, BookOpen, Users, CheckCircle2, Clock, Heart, XCircle, Save, Plus, Edit2, Trash2, Check } from 'lucide-react'
import { getSync, mutateData } from '@/lib/db'
import { SURAHS } from '@/data/surahs'
import toast from 'react-hot-toast'

interface EditMeetingModalProps {
  meetingId: string
  entityId: string // class_id
  entityType?: string
  activeWorkspaceId: string // guru_id
  onClose: () => void
  onSuccess: () => void
}

export default function EditMeetingModal({ meetingId, entityId, entityType = 'sekolah', activeWorkspaceId, onClose, onSuccess }: EditMeetingModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [meeting, setMeeting] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  
  // State for Jurnal
  const [date, setDate] = useState('')
  const [summary, setSummary] = useState('')

  // State for Absensi
  const [attendance, setAttendance] = useState<Record<string, { id?: string, status: string }>>({})

  // State for Memorizations (1 siswa bisa punya BANYAK setoran)
  const [memorizations, setMemorizations] = useState<Record<string, any[]>>({})
  const [deletedMemIds, setDeletedMemIds] = useState<string[]>([]) // Track deleted existing records
  
  // Track which forms are currently in "edit" mode open
  const [editingMemIds, setEditingMemIds] = useState<string[]>([])

  // Tab
  const [activeTab, setActiveTab] = useState<'jurnal' | 'absensi' | 'hafalan'>('jurnal')

  useEffect(() => {
    const loadMeetingData = async () => {
      setLoading(true)
      
      const allMeetings = getSync('tahfidz_meetings')
      const m = allMeetings.find((x: any) => x.id === meetingId)
      if (!m) {
        toast.error('Data pertemuan tidak ditemukan')
        onClose()
        return
      }

      setMeeting(m)
      setDate(m.date ? m.date.slice(0, 10) : new Date().toISOString().slice(0, 10))
      
      const defaultSummary = `Materi:\n\nEvaluasi:\n\nKendala:\n\nCatatan:\n\nTarget Berikutnya:\n`
      setSummary(m.summary || m.notes || defaultSummary)

      // Load Students
      let allStudents = []
      if (entityType === 'sekolah') {
        allStudents = getSync('tahfidz_students').filter((s:any) => s.class_id === entityId && s.name)
      } else if (entityType === 'les') {
        allStudents = getSync('tahfidz_lesson_students').filter((s:any) => s.group_id === entityId)
      } else if (entityType === 'privat') {
        // Special case for privat if needed
      }
      setStudents(allStudents)

      // Load Attendance for this meeting
      const allAtt = getSync('tahfidz_attendance_records').filter((a: any) => a.meeting_id === meetingId)
      const initAtt: Record<string, { id?: string, status: string }> = {}
      allStudents.forEach((s: any) => {
        const existingAtt = allAtt.find((a: any) => a.student_id === s.id)
        if (existingAtt) {
          initAtt[s.id] = { id: existingAtt.id, status: existingAtt.status }
        } else {
          initAtt[s.id] = { status: 'alpa' } // Default if new student
        }
      })
      setAttendance(initAtt)

      // Load Memorizations for this meeting
      const allMems = getSync('tahfidz_memorization_records').filter((m: any) => m.meeting_id === meetingId)
      const initMems: Record<string, any[]> = {}
      allStudents.forEach((s: any) => {
        initMems[s.id] = []
      })
      
      allMems.forEach((m: any) => {
        if (!initMems[m.student_id]) initMems[m.student_id] = []
        // Add a local uiId to manage state without relying on db ID exclusively
        initMems[m.student_id].push({ ...m, uiId: m.id }) 
      })
      
      setMemorizations(initMems)
      setLoading(false)
    }

    loadMeetingData()
  }, [meetingId, entityId, entityType])

  const handleAttChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }))
  }

  const handleMemChange = (studentId: string, uiId: string, field: string, value: any) => {
    setMemorizations(prev => {
      const studentMems = prev[studentId] || []
      const updatedMems = studentMems.map(m => {
        if (m.uiId === uiId) {
          return { ...m, [field]: value }
        }
        return m
      })
      return { ...prev, [studentId]: updatedMems }
    })
  }

  const handleAddMem = (studentId: string) => {
    const newUiId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    setMemorizations(prev => {
      const studentMems = prev[studentId] || []
      return {
        ...prev,
        [studentId]: [
          ...studentMems,
          {
            uiId: newUiId,
            isNew: true, // Flag to know it's a new insert
            surah_name: SURAHS[0].name_latin,
            verse_start: 1,
            verse_end: 1,
            score: 85,
            status: 'lancar',
            note: '',
            surat_selesai: false
          }
        ]
      }
    })
    
    // Automatically open edit mode for the newly added form
    setEditingMemIds(prev => [...prev, newUiId])
  }
  
  const handleRemoveMem = (studentId: string, uiId: string) => {
    if (confirm('Hapus setoran ini?')) {
      const memToRemove = memorizations[studentId]?.find(m => m.uiId === uiId)
      
      // If it's an existing record from DB, track it for deletion
      if (memToRemove && !memToRemove.isNew && memToRemove.id) {
        setDeletedMemIds(prev => [...prev, memToRemove.id])
      }
      
      // Remove from UI
      setMemorizations(prev => {
        const studentMems = prev[studentId] || []
        return {
          ...prev,
          [studentId]: studentMems.filter(m => m.uiId !== uiId)
        }
      })
      
      // Remove from editing state
      setEditingMemIds(prev => prev.filter(id => id !== uiId))
    }
  }

  const toggleEditMem = (uiId: string) => {
    if (editingMemIds.includes(uiId)) {
      setEditingMemIds(prev => prev.filter(id => id !== uiId))
    } else {
      setEditingMemIds(prev => [...prev, uiId])
    }
  }

  const handleSave = async () => {
    setSaving(true)

    // 1. Update Meeting
    const updatedMeeting = {
      ...meeting,
      date: new Date(date).toISOString(),
      summary
    }
    delete updatedMeeting.notes // Fix DB Schema error
    
    const meetRes = await mutateData('meetings', 'UPDATE', updatedMeeting, 'tahfidz_meetings')
    if (!meetRes.success) {
      toast.error('Gagal menyimpan jurnal pertemuan')
      setSaving(false)
      return
    }

    // 2. Update/Insert Attendance
    const attPromises = students.map(s => {
      const att = attendance[s.id]
      if (att.id) {
        return mutateData('attendance_records', 'UPDATE', { id: att.id, status: att.status }, 'tahfidz_attendance_records')
      } else {
        const newAtt = {
          id: `att-${Date.now()}-${s.id}`,
          meeting_id: meetingId,
          class_id: entityId,
          guru_id: activeWorkspaceId,
          student_id: s.id,
          status: att.status,
          created_at: new Date(date).toISOString()
        }
        return mutateData('attendance_records', 'INSERT', newAtt, 'tahfidz_attendance_records')
      }
    })
    await Promise.all(attPromises)

    // 3. Delete removed Memorizations
    const deletePromises = deletedMemIds.map(id => {
      return mutateData('memorization_records', 'DELETE', { id }, 'tahfidz_memorization_records')
    })
    await Promise.all(deletePromises)

    // 4. Update/Insert Memorizations
    const memPromises: Promise<any>[] = []
    
    Object.keys(memorizations).forEach(studentId => {
      const studentMems = memorizations[studentId] || []
      
      studentMems.forEach(m => {
        // If it has an ID and not new, it's an update
        if (m.id && !m.isNew) {
          memPromises.push(mutateData('memorization_records', 'UPDATE', {
            id: m.id,
            surah_name: m.surah_name,
            verse_start: String(m.verse_start),
            verse_end: String(m.verse_end),
            score: Number(m.score),
            status: m.status,
            note: m.note,
            surat_selesai: m.surat_selesai || false
          }, 'tahfidz_memorization_records'))
        } else if (m.isNew) {
          // It's a newly added mem during edit
          const newMem = {
            id: `mem-${Date.now()}-${studentId}-${Math.random().toString(36).substr(2, 9)}`,
            meeting_id: meetingId,
            class_id: entityId,
            guru_id: activeWorkspaceId,
            student_id: studentId,
            date: new Date(date).toISOString(),
            created_at: new Date(date).toISOString(),
            surah_name: m.surah_name,
            verse_start: String(m.verse_start),
            verse_end: String(m.verse_end),
            score: Number(m.score),
            status: m.status,
            note: m.note,
            surat_selesai: m.surat_selesai || false
          }
          memPromises.push(mutateData('memorization_records', 'INSERT', newMem, 'tahfidz_memorization_records'))
        }
      })
    })
    
    await Promise.all(memPromises)

    setSaving(false)
    toast.success('Pertemuan berhasil diperbarui!')
    onSuccess()
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>Memuat data...</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--clr-gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: 'var(--clr-gray-900)' }}>Edit Jurnal Pertemuan</h2>
            <div style={{ fontSize: '13px', color: 'var(--clr-gray-500)' }}>Perbarui catatan kelas, absensi, dan setoran hafalan secara fleksibel.</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--clr-gray-100)', border: 'none', cursor: 'pointer', color: 'var(--clr-gray-600)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--clr-gray-200)', background: 'var(--clr-gray-50)' }}>
          <button 
            style={{ flex: 1, padding: '14px', background: activeTab === 'jurnal' ? 'white' : 'transparent', border: 'none', borderBottom: activeTab === 'jurnal' ? '2px solid var(--clr-primary-600)' : '2px solid transparent', color: activeTab === 'jurnal' ? 'var(--clr-primary-700)' : 'var(--clr-gray-500)', fontWeight: activeTab === 'jurnal' ? 600 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('jurnal')}
          >
            <ClipboardList size={16} /> Jurnal Mengajar
          </button>
          <button 
            style={{ flex: 1, padding: '14px', background: activeTab === 'absensi' ? 'white' : 'transparent', border: 'none', borderBottom: activeTab === 'absensi' ? '2px solid var(--clr-primary-600)' : '2px solid transparent', color: activeTab === 'absensi' ? 'var(--clr-primary-700)' : 'var(--clr-gray-500)', fontWeight: activeTab === 'absensi' ? 600 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('absensi')}
          >
            <Users size={16} /> Absensi
          </button>
          <button 
            style={{ flex: 1, padding: '14px', background: activeTab === 'hafalan' ? 'white' : 'transparent', border: 'none', borderBottom: activeTab === 'hafalan' ? '2px solid var(--clr-primary-600)' : '2px solid transparent', color: activeTab === 'hafalan' ? 'var(--clr-primary-700)' : 'var(--clr-gray-500)', fontWeight: activeTab === 'hafalan' ? 600 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('hafalan')}
          >
            <BookOpen size={16} /> Setoran Hafalan
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', background: 'var(--clr-gray-50)' }}>
          
          {/* TAB: JURNAL */}
          {activeTab === 'jurnal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Pertemuan</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid var(--clr-gray-200)', padding: '10px 14px', borderRadius: '8px', transition: 'border-color 0.2s' }}>
                  <Calendar size={18} color="var(--clr-gray-400)" />
                  <input type="date" style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px' }} value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Jurnal Pembelajaran</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '300px', fontFamily: 'monospace', lineHeight: 1.6, fontSize: '14px', padding: '16px' }}
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Materi:&#10;Evaluasi:&#10;Kendala:&#10;Catatan:&#10;Target:"
                />
                <small style={{ color: 'var(--clr-gray-500)', marginTop: '8px', display: 'block' }}>Gunakan format teks bebas untuk mencatat aktivitas kelas, materi talqin, evaluasi, dan kendala hari ini.</small>
              </div>
            </div>
          )}

          {/* TAB: ABSENSI */}
          {activeTab === 'absensi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '8px' }}>
                <div style={{ background: 'var(--clr-success)', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px' }}>{Object.values(attendance).filter(a => a.status === 'hadir').length}</span>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>Hadir</span>
                </div>
                <div style={{ background: 'var(--clr-warning)', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px' }}>{Object.values(attendance).filter(a => a.status === 'izin').length}</span>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>Izin</span>
                </div>
                <div style={{ background: 'var(--clr-info)', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px' }}>{Object.values(attendance).filter(a => a.status === 'sakit').length}</span>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>Sakit</span>
                </div>
                <div style={{ background: 'var(--clr-danger)', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px' }}>{Object.values(attendance).filter(a => a.status === 'alpa').length}</span>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>Alpa</span>
                </div>
              </div>
              
              {students.map((s, idx) => {
                const stat = attendance[s.id]?.status || 'alpa'
                return (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--clr-gray-200)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--clr-gray-400)', width: '20px' }}>{idx + 1}.</span>
                      <span style={{ fontWeight: 600, color: 'var(--clr-gray-800)', fontSize: '15px' }}>{s.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['hadir', 'izin', 'sakit', 'alpa'].map(type => (
                        <button
                          key={type}
                          onClick={() => handleAttChange(s.id, type)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '100px',
                            border: '1px solid',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            background: stat === type ? `var(--clr-${type === 'hadir' ? 'success' : type === 'izin' ? 'warning' : type === 'sakit' ? 'info' : 'danger'})` : 'white',
                            color: stat === type ? 'white' : 'var(--clr-gray-600)',
                            borderColor: stat === type ? `var(--clr-${type === 'hadir' ? 'success' : type === 'izin' ? 'warning' : type === 'sakit' ? 'info' : 'danger'})` : 'var(--clr-gray-200)'
                          }}
                        >
                          {type === 'hadir' ? <CheckCircle2 size={14} /> : type === 'izin' ? <Clock size={14} /> : type === 'sakit' ? <Heart size={14} /> : <XCircle size={14} />}
                          <span style={{ textTransform: 'capitalize' }}>{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB: HAFALAN */}
          {activeTab === 'hafalan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--clr-primary-50)', padding: '16px', borderRadius: '8px', color: 'var(--clr-primary-800)', fontSize: '14px', border: '1px solid var(--clr-primary-200)', marginBottom: '8px' }}>
                <strong>Multi-Setoran Aktif:</strong> Anda dapat menambahkan lebih dari satu setoran untuk tiap siswa. Data lama juga bisa diedit atau dihapus satuan.
              </div>

              {students.map((s) => {
                const studentMems = memorizations[s.id] || []
                
                return (
                  <div key={s.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {/* Header Siswa */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: studentMems.length > 0 ? '16px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--clr-primary-100)', color: 'var(--clr-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--clr-gray-900)', fontSize: '15px' }}>{s.name}</div>
                          {studentMems.length > 0 ? (
                            <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)' }}>{studentMems.length} setoran tercatat</div>
                          ) : (
                            <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)' }}>Belum ada setoran</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Daftar Setoran */}
                    {studentMems.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                        {studentMems.map((mem, idx) => {
                          const isEditing = editingMemIds.includes(mem.uiId)
                          
                          return (
                            <div key={mem.uiId} style={{ border: '1px solid var(--clr-gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
                              
                              {/* Setoran Summary Bar */}
                              <div style={{ background: 'var(--clr-gray-50)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--clr-gray-500)' }}>Setoran {idx + 1}</span>
                                  {!isEditing && (
                                    <>
                                      <span style={{ fontSize: '14px', fontWeight: 600 }}>Surat {mem.surah_name} (Ayat {mem.verse_start}-{mem.verse_end})</span>
                                      <span style={{ background: 'var(--clr-success)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '100px', fontWeight: 'bold' }}>Nilai: {mem.score}</span>
                                    </>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => toggleEditMem(mem.uiId)} style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: isEditing ? 'var(--clr-gray-200)' : 'white', border: '1px solid var(--clr-gray-300)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                                    {isEditing ? <><Check size={14} /> Tutup</> : <><Edit2 size={14} /> Edit</>}
                                  </button>
                                  <button onClick={() => handleRemoveMem(s.id, mem.uiId)} style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'white', border: '1px solid var(--clr-danger)', color: 'var(--clr-danger)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                                    <Trash2 size={14} /> Hapus
                                  </button>
                                </div>
                              </div>

                              {/* Setoran Edit Form */}
                              {isEditing && (
                                <div style={{ padding: '16px', background: 'white' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Surat</label>
                                      <select className="form-select" style={{ padding: '10px' }} value={mem.surah_name} onChange={e => handleMemChange(s.id, mem.uiId, 'surah_name', e.target.value)}>
                                        {SURAHS.map(sur => (
                                          <option key={sur.number} value={sur.name_latin}>{sur.number}. {sur.name_latin}</option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                        <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Ayat Awal</label>
                                        <input type="number" className="form-input" style={{ padding: '10px' }} value={mem.verse_start} onChange={e => handleMemChange(s.id, mem.uiId, 'verse_start', e.target.value)} />
                                      </div>
                                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                        <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Ayat Akhir</label>
                                        <input type="number" className="form-input" style={{ padding: '10px' }} value={mem.verse_end} onChange={e => handleMemChange(s.id, mem.uiId, 'verse_end', e.target.value)} />
                                      </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: 'var(--clr-gray-50)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--clr-gray-200)' }}>
                                        <input type="checkbox" checked={mem.surat_selesai} onChange={e => handleMemChange(s.id, mem.uiId, 'surat_selesai', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--clr-primary-600)' }} />
                                        Tandai Sudah Hafal 1 Surat Penuh
                                      </label>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Status Kelancaran</label>
                                      <select className="form-select" style={{ padding: '10px' }} value={mem.status} onChange={e => {
                                        const newStatus = e.target.value
                                        handleMemChange(s.id, mem.uiId, 'status', newStatus)
                                        
                                        let newScore = mem.score
                                        if (newStatus === 'sangat_lancar') newScore = 95
                                        else if (newStatus === 'lancar') newScore = 90
                                        else if (newStatus === 'cukup' || newStatus === 'cukup_lancar') newScore = 85
                                        else if (newStatus === 'perlu_murojaah') newScore = 80
                                        else if (newStatus === 'belum_lancar' || newStatus === 'ulangi') newScore = 75
                                        
                                        handleMemChange(s.id, mem.uiId, 'score', newScore)
                                      }}>
                                        <option value="sangat_lancar">Sangat Lancar</option>
                                        <option value="lancar">Lancar</option>
                                        <option value="cukup">Cukup</option>
                                        <option value="perlu_murojaah">Perlu Murojaah</option>
                                        <option value="belum_lancar">Belum Lancar</option>
                                      </select>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Nilai Angka (1-100)</label>
                                      <input type="number" className="form-input" style={{ padding: '10px' }} value={mem.score} onChange={e => handleMemChange(s.id, mem.uiId, 'score', e.target.value)} />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Catatan Guru (Opsional)</label>
                                      <input type="text" className="form-input" style={{ padding: '10px' }} placeholder="Contoh: Perlu perbaikan makharij huruf pada ayat 3" value={mem.note || ''} onChange={e => handleMemChange(s.id, mem.uiId, 'note', e.target.value)} />
                                    </div>
                                    
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Tombol Tambah Setoran Siswa ini */}
                    <button onClick={() => handleAddMem(s.id)} style={{ width: '100%', padding: '12px', background: 'white', border: '1px dashed var(--clr-primary-400)', color: 'var(--clr-primary-700)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                      <Plus size={18} /> Tambah Setoran Baru
                    </button>
                    
                  </div>
                )
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--clr-gray-200)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'white' }}>
          <button className="btn-outline" onClick={onClose} disabled={saving} style={{ padding: '10px 20px', fontWeight: 600 }}>Batal</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}>
            {saving ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
          </button>
        </div>

      </div>
    </div>
  )
}
