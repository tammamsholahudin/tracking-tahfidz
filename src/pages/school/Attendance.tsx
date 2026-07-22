import { useState, useEffect } from 'react'
import { ClipboardList, CheckCircle2, XCircle, Clock, Heart, Calendar, Trash2, Edit, CheckSquare, Printer } from 'lucide-react'
import { exportAttendanceExcel } from '@/lib/excel'
import { exportAttendancePDF } from '@/lib/pdf'
import { getSync, mutateData } from '@/lib/db'
import { moveToTrash } from '@/lib/trash'
import { useAuthStore } from '@/store/authStore'
import EditMeetingModal from '@/components/EditMeetingModal'
import toast from 'react-hot-toast'
import styles from './Attendance.module.css'

interface AttendancePageProps { 
  entityId: string 
  entityType?: string
  entityData?: any // To pass to export
}

export default function AttendancePage({ entityId, entityType = 'sekolah', entityData }: AttendancePageProps) {
  const [meetings, setMeetings] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)
  
  // Bulk Actions State (For Meetings)
  // Bulk Actions State (For Meetings)
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<string[]>([])
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null)
  
  const { activeWorkspace } = useAuthStore()

  const loadData = () => {
    const allMeetings = getSync('tahfidz_meetings')
    const classMeetings = allMeetings.filter((m: any) => m.class_id === entityId).reverse()
    
    const allAtt = getSync('tahfidz_attendance_records')
    const classAtt = allAtt.filter((a: any) => a.class_id === entityId)
    
    const meetingsWithStats = classMeetings.map((m: any) => {
      const mAtt = classAtt.filter((a: any) => a.meeting_id === m.id)
      return {
        ...m,
        hadir: mAtt.filter((a: any) => a.status === 'hadir').length,
        izin: mAtt.filter((a: any) => a.status === 'izin').length,
        sakit: mAtt.filter((a: any) => a.status === 'sakit').length,
        alpa: mAtt.filter((a: any) => a.status === 'alpa').length,
      }
    })
    
    setMeetings(meetingsWithStats)
    setAttendanceData(classAtt)
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('local_cache_updated', handleUpdate)
    return () => window.removeEventListener('local_cache_updated', handleUpdate)
  }, [entityId, entityType])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  // --- BULK ACTIONS FOR MEETINGS ---
  const toggleMeetingSelect = (id: string) => {
    setSelectedMeetingIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAllMeetings = () => {
    if (selectedMeetingIds.length === meetings.length) setSelectedMeetingIds([])
    else setSelectedMeetingIds(meetings.map(m => m.id))
  }

  const handleMassDeleteMeetings = async () => {
    if (!confirm(`Hapus ${selectedMeetingIds.length} pertemuan secara permanen? (Data akan dipindah ke Sampah)`)) return
    
    for (const id of selectedMeetingIds) {
      const m = meetings.find(x => x.id === id)
      if (m) {
        await moveToTrash('meetings', id, `Pertemuan ${formatDate(m.date)}`, 'Guru', activeWorkspace?.id || '')
      }
    }
    
    toast.success(`${selectedMeetingIds.length} pertemuan berhasil dihapus ke Sampah`)
    setSelectedMeetingIds([])
  }

  const handleExportPDF = () => {
    if (!entityData) {
      toast.error('Data belum dimuat')
      return
    }
    toast.success('Menyiapkan PDF...')
    
    const exportMeetings = meetings.filter(m => selectedMeetingIds.includes(m.id)).reverse()
    let allStudents = []
    if (entityType === 'sekolah') {
      allStudents = getSync('tahfidz_students').filter((s:any) => s.class_id === entityId && s.name)
    } else if (entityType === 'les') {
      allStudents = getSync('tahfidz_lesson_students').filter((s:any) => s.group_id === entityId)
    } else if (entityType === 'privat') {
      allStudents = [entityData]
    }
    
    const dataToExport = allStudents.map((s: any, idx: number) => {
      const row: any = { No: idx + 1, Nama: s.name }
      let h = 0, i = 0, sk = 0, a = 0
      
      exportMeetings.forEach((m: any, mIdx: number) => {
        const att = attendanceData.find(at => at.meeting_id === m.id && at.student_id === s.id)
        let st = att ? att.status : '-'
        if (st === 'hadir') { st = 'H'; h++ }
        else if (st === 'izin') { st = 'I'; i++ }
        else if (st === 'sakit') { st = 'S'; sk++ }
        else if (st === 'alpa') { st = 'A'; a++ }
        const dateStr = new Date(m.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
        row[`P${mIdx + 1}\n(${dateStr})`] = st
      })

      row['Jumlah Hadir'] = h
      row['Jumlah Izin'] = i
      row['Jumlah Sakit'] = sk
      row['Jumlah Alpha'] = a
      const total = h + i + sk + a
      row['Persentase Kehadiran'] = total > 0 ? Math.round((h / total) * 100) + '%' : '0%'
      return row
    })

    exportAttendancePDF(dataToExport, entityData, `Laporan_Absensi_${entityData.name}.pdf`, exportMeetings)
  }

  const handleExportExcel = () => {
    if (!entityData) {
      toast.error('Data belum dimuat')
      return
    }
    toast.success('Mengekspor Excel...')
    
    const exportMeetings = meetings.filter(m => selectedMeetingIds.includes(m.id)).reverse() 
    let allStudents = []
    if (entityType === 'sekolah') {
      allStudents = getSync('tahfidz_students').filter((s:any) => s.class_id === entityId && s.name)
    } else if (entityType === 'les') {
      allStudents = getSync('tahfidz_lesson_students').filter((s:any) => s.group_id === entityId)
    } else if (entityType === 'privat') {
      allStudents = [entityData]
    }
    
    const dataToExport = allStudents.map((s: any, idx: number) => {
      const row: any = { No: idx + 1, Nama: s.name }
      let h = 0, i = 0, sk = 0, a = 0
      
      exportMeetings.forEach((m: any, mIdx: number) => {
        const att = attendanceData.find(at => at.meeting_id === m.id && at.student_id === s.id)
        let st = att ? att.status : '-'
        if (st === 'hadir') { st = 'H'; h++ }
        else if (st === 'izin') { st = 'I'; i++ }
        if (st === 'sakit') { st = 'S'; sk++ }
        else if (st === 'alpa') { st = 'A'; a++ }
        const dateStr = new Date(m.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
        row[`P${mIdx + 1}\n(${dateStr})`] = st
      })

      row['Jumlah Hadir'] = h
      row['Jumlah Izin'] = i
      row['Jumlah Sakit'] = sk
      row['Jumlah Alpha'] = a
      const total = h + i + sk + a
      row['Persentase Kehadiran'] = total > 0 ? Math.round((h / total) * 100) + '%' : '0%'
      return row
    })

    exportAttendanceExcel(dataToExport, entityData, `Laporan_Absensi_${entityData.name}.xlsx`)
  }

  const handleEditMeeting = () => {
    if (selectedMeetingIds.length > 1) {
      toast.error('Pilih hanya satu pertemuan untuk diedit')
      return
    }
    setEditingMeetingId(selectedMeetingIds[0])
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerCard} style={{ background: 'white', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-gray-200)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 var(--space-2) 0' }}>
          <ClipboardList size={20} /> Rekap Absensi Pertemuan
        </h2>
        <p style={{ color: 'var(--clr-gray-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
          Daftar seluruh pertemuan. Centang baris untuk mengekspor atau menghapus, atau klik area kosong pada baris untuk melihat detail.
        </p>
      </div>

      {/* Toolbar Bulk Actions */}
      {meetings.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--clr-gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--clr-gray-200)' }}>
          <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={toggleSelectAllMeetings}>
            <CheckSquare size={14} /> {selectedMeetingIds.length === meetings.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </button>
          
          {selectedMeetingIds.length > 0 && (
            <>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleEditMeeting}>
                <Edit size={14} /> Edit
              </button>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }} onClick={handleMassDeleteMeetings}>
                <Trash2 size={14} /> Ke Sampah
              </button>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleExportPDF}>
                📄 Export PDF
              </button>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleExportExcel}>
                📊 Export Excel
              </button>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => window.print()}>
                <Printer size={14} /> Cetak
              </button>
              <span style={{ fontSize: '12px', color: 'var(--clr-primary-700)', fontWeight: 600, marginLeft: 'auto' }}>
                {selectedMeetingIds.length} dipilih
              </span>
            </>
          )}
        </div>
      )}

      {meetings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--clr-gray-200)' }}>
          <Calendar size={40} color="var(--clr-gray-300)" style={{ marginBottom: 'var(--space-2)' }} />
          <p style={{ color: 'var(--clr-gray-500)' }}>Belum ada data pertemuan.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.desktopTable}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--clr-gray-50)', borderBottom: '1px solid var(--clr-gray-200)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-3)', width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedMeetingIds.length === meetings.length && meetings.length > 0} 
                      onChange={toggleSelectAllMeetings} 
                      style={{ accentColor: 'var(--clr-primary-600)' }} 
                    />
                  </th>
                  <th style={{ padding: 'var(--space-3)' }}>No</th>
                  <th style={{ padding: 'var(--space-3)' }}>Hari, Tanggal</th>
                  <th style={{ padding: 'var(--space-3)' }}>Catatan / Topik</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Hadir</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Izin</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Sakit</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Alpa</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m, idx) => {
                  const isSelected = selectedMeetingIds.includes(m.id)
                  return (
                    <tr 
                      key={m.id} 
                      style={{ 
                        borderBottom: '1px solid var(--clr-gray-100)', 
                        background: isSelected ? 'var(--clr-primary-50)' : 'transparent' 
                      }}
                      className={styles.tableRow}
                    >
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleMeetingSelect(m.id)}
                          style={{ accentColor: 'var(--clr-primary-600)' }} 
                        />
                      </td>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setSelectedMeeting(m)}>{meetings.length - idx}</td>
                      <td style={{ padding: 'var(--space-3)', cursor: 'pointer' }} onClick={() => setSelectedMeeting(m)}>{formatDate(m.date)}</td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--clr-gray-500)', cursor: 'pointer' }} onClick={() => setSelectedMeeting(m)}>{m.notes || '-'}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--clr-success)', fontWeight: 'bold' }}>{m.hadir}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--clr-warning)', fontWeight: 'bold' }}>{m.izin}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--clr-info)', fontWeight: 'bold' }}>{m.sakit}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--clr-danger)', fontWeight: 'bold' }}>{m.alpa}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileCards}>
            {meetings.map((m, idx) => {
              const isSelected = selectedMeetingIds.includes(m.id)
              const d = new Date(m.date)
              const dayStr = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()]
              const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              let hadir = 0, izin = 0, sakit = 0, alpa = 0
              Object.values(m.students_attendance || {}).forEach(st => {
                if (st === 'hadir') hadir++
                if (st === 'izin') izin++
                if (st === 'sakit') sakit++
                if (st === 'alpa') alpa++
              })

              return (
                <div key={m.id} className={`${styles.mCard} ${isSelected ? styles.mCardSelected : ''}`} onClick={(e) => {
                  if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return
                  setSelectedMeeting(m)
                }}>
                  <div className={styles.mCardHeader}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => { e.stopPropagation(); toggleMeetingSelect(m.id) }}
                      className={styles.mCheckbox}
                    />
                    <div className={styles.mCardTitleWrap}>
                      <div className={styles.mCardDate}>{dayStr}, {dateStr}</div>
                      <div className={styles.mCardTitle}>Pertemuan {idx + 1}</div>
                    </div>
                  </div>
                  {m.notes && <div className={styles.mCardNotes}>{m.notes}</div>}
                  <div className={styles.mCardStats}>
                    <span className={styles.mStatH}>Hadir: {hadir}</span>
                    <span className={styles.mStatI}>Izin: {izin}</span>
                    <span className={styles.mStatS}>Sakit: {sakit}</span>
                    <span className={styles.mStatA}>Alpa: {alpa}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Detail Absensi (Tetap dipertahankan untuk melihat siapa saja yang hadir dsb) */}
      {selectedMeeting && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMeeting(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--clr-gray-100)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>Detail Kehadiran</h3>
                <small style={{ color: 'var(--clr-gray-500)' }}>{formatDate(selectedMeeting.date)}</small>
              </div>
            </div>

            {(() => {
              const records = attendanceData.filter((a: any) => a.meeting_id === selectedMeeting.id)
              records.sort((a: any, b: any) => (a.student_name || '').localeCompare(b.student_name || ''))
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {records.map((a: any, idx: number) => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px dashed var(--clr-gray-100)', background: 'transparent', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--clr-gray-500)', fontWeight: 600, width: 20 }}>{idx + 1}.</span>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{a.student_name}</span>
                      </div>
                      <span className={`badge badge-${a.status}`} style={{ fontSize: '10px' }}>
                        {a.status === 'hadir' ? <CheckCircle2 size={12} />
                         : a.status === 'izin' ? <Clock size={12} />
                         : a.status === 'sakit' ? <Heart size={12} />
                         : <XCircle size={12} />}
                        {a.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })()}

            <button onClick={() => setSelectedMeeting(null)} className="btn-outline" style={{ width: '100%', marginTop: 'var(--space-4)' }}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Edit Pertemuan (Jurnal Mengajar) */}
      {editingMeetingId && (
        <EditMeetingModal
          meetingId={editingMeetingId}
          entityId={entityId}
          entityType={entityType}
          activeWorkspaceId={activeWorkspace?.id || ''}
          onClose={() => setEditingMeetingId(null)}
          onSuccess={() => {
            setEditingMeetingId(null)
            setSelectedMeetingIds([])
          }}
        />
      )}
    </div>
  )
}
