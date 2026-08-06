import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, FileText, CheckCircle2, ClipboardList, BookOpen, Edit2 } from 'lucide-react'
import { getSync, fetchBackground } from '@/lib/db'
import { useAuthStore } from '@/store/authStore'

export default function ArchiveMeetingPage({ entityId, entityType: _entityType, onEditMeeting }: { entityId: string, entityType: string, onEditMeeting?: (meetingId: string) => void }) {
  const [meetings, setMeetings] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'absensi' | 'setoran' | 'jurnal'>('overview')
  
  useEffect(() => {
    loadData()
    // Fetch data terbaru dari Supabase di background agar cache selalu segar
    // Ini adalah penyebab utama bug: tanpa fetch ini, attendance bisa kosong
    const { activeWorkspaceId } = useAuthStore.getState()
    if (navigator.onLine && activeWorkspaceId) {
      Promise.all([
        fetchBackground('attendance_records', 'tahfidz_attendance_records', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('memorization_records', 'tahfidz_memorization_records', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
        fetchBackground('meetings', 'tahfidz_meetings', { filterColumn: 'guru_id', filterValue: activeWorkspaceId }),
      ]).catch(console.error)
    }
    window.addEventListener('local_cache_updated', loadData)
    return () => window.removeEventListener('local_cache_updated', loadData)
  }, [entityId])

  const loadData = () => {
    const allMeetings = getSync('tahfidz_meetings').filter((m: any) => m.class_id === entityId)
    allMeetings.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setMeetings(allMeetings)
  }

  const getMeetingDetails = (meetingId: string) => {
    // ✅ FIX #3: Filter attendance berdasarkan meeting_id (sudah benar)
    const att = getSync('tahfidz_attendance_records').filter((a: any) => a.meeting_id === meetingId)
    
    // ✅ FIX #1: Filter memorization berdasarkan meeting_id, BUKAN tanggal
    // Bug sebelumnya: filter berdasarkan tanggal → setoran bisa tercampur antar pertemuan
    // dan jika ada perbedaan timezone, toDateString() bisa menghasilkan tanggal yang berbeda
    const mems = getSync('tahfidz_memorization_records').filter((m: any) => m.meeting_id === meetingId)

    // Ambil students sesuai entity type
    let students: any[] = []
    if (_entityType === 'les') {
      students = getSync('tahfidz_lesson_students').filter((s: any) => s.group_id === entityId)
    } else if (_entityType === 'privat') {
      const p = getSync('tahfidz_private_students').find((x: any) => x.id === entityId)
      if (p) students = [p]
    } else {
      students = getSync('tahfidz_students').filter((s: any) => s.class_id === entityId)
    }
    
    const rekap = {
      hadir: att.filter((a: any) => a.status === 'hadir').length,
      izin: att.filter((a: any) => a.status === 'izin').length,
      sakit: att.filter((a: any) => a.status === 'sakit').length,
      alpa: att.filter((a: any) => a.status === 'alpa').length,
    }

    // Sort students by name
    students.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))

    return { att, mems, students, rekap }
  }

  return (
    <div style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--clr-gray-800)', marginBottom: '8px' }}>
            Arsip Pertemuan
          </h2>
          <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>
            Riwayat seluruh pertemuan yang telah difinalisasi. Data bersifat <i>Read-Only</i>.
          </p>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px dashed var(--clr-gray-200)' }}>
          <p style={{ color: 'var(--clr-gray-500)' }}>Belum ada pertemuan yang dicatat.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {meetings.map((m, idx) => {
            const isExpanded = expandedId === m.id
            const dateStr = new Date(m.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            
            // ✅ FIX #5: Calculate quick summary untuk header — gunakan meeting_id, BUKAN tanggal
            const attList = getSync('tahfidz_attendance_records').filter((a: any) => a.meeting_id === m.id)
            const countHadir = attList.filter((a: any) => a.status === 'hadir').length
            // ✅ FIX: Filter memorization berdasarkan meeting_id bukan tanggal
            const memList = getSync('tahfidz_memorization_records').filter((mem: any) => mem.meeting_id === m.id)

            return (
              <div key={m.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--clr-gray-200)', overflow: 'hidden' }}>
                <div 
                  style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? 'var(--clr-gray-50)' : 'white' }}
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedId(null)
                    } else {
                      setExpandedId(m.id)
                      setActiveSubTab('overview')
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'var(--clr-primary-100)', color: 'var(--clr-primary-700)', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>
                      Pertemuan {meetings.length - idx}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{dateStr}</div>
                      <div style={{ fontSize: '13px', color: 'var(--clr-gray-500)', marginTop: '4px' }}>
                        {countHadir} Hadir &middot; {memList.length} Setoran &middot; {m.summary ? 'Jurnal tersedia' : 'Tanpa catatan'}
                      </div>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? <ChevronUp size={20} color="var(--clr-gray-500)" /> : <ChevronDown size={20} color="var(--clr-gray-500)" />}
                  </div>
                </div>

                {isExpanded && (() => {
                  const details = getMeetingDetails(m.id)
                  
                  return (
                    <div style={{ padding: '0', borderTop: '1px solid var(--clr-gray-200)' }}>
                      
                      {/* SUB-TABS */}
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--clr-gray-200)', padding: '0 16px', gap: '16px', background: 'var(--clr-gray-50)' }}>
                        {[
                          { id: 'overview', label: 'Overview', icon: <CheckCircle2 size={14} /> },
                          { id: 'absensi', label: 'Absensi', icon: <ClipboardList size={14} /> },
                          { id: 'setoran', label: 'Setoran Hafalan', icon: <BookOpen size={14} /> },
                          { id: 'jurnal', label: 'Jurnal', icon: <FileText size={14} /> }
                        ].map(tab => (
                          <div 
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id as any)}
                            style={{ 
                              padding: '12px 0', 
                              cursor: 'pointer',
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              fontSize: '13px',
                              fontWeight: activeSubTab === tab.id ? 600 : 500,
                              color: activeSubTab === tab.id ? 'var(--clr-primary-700)' : 'var(--clr-gray-500)',
                              borderBottom: activeSubTab === tab.id ? '2px solid var(--clr-primary-600)' : '2px solid transparent',
                              marginBottom: '-1px'
                            }}
                          >
                            {tab.icon} {tab.label}
                          </div>
                        ))}
                      </div>

                      <div style={{ padding: '16px' }}>
                        
                        {/* 1. OVERVIEW */}
                        {activeSubTab === 'overview' && (
                          <div style={{ padding: '24px' }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--clr-gray-700)', margin: 0 }}>
                              Ringkasan Pertemuan
                            </h4>
                            {onEditMeeting && (
                              <button 
                                onClick={() => {
                                  if (confirm('Anda akan membuka kembali pertemuan yang sudah difinalisasi. Seluruh perubahan pada mode edit ini akan dicatat dalam riwayat audit. Lanjutkan?')) {
                                    onEditMeeting(m.id)
                                  }
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  padding: '8px 16px', borderRadius: '8px',
                                  border: '1px solid var(--clr-primary-200)',
                                  background: 'var(--clr-primary-50)', color: 'var(--clr-primary-700)',
                                  fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                                }}
                              >
                                <Edit2 size={16} /> Edit Pertemuan
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div style={{ background: 'var(--clr-gray-50)', padding: '12px', borderRadius: '8px' }}>
                              <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', marginBottom: '4px' }}>Hari, Tanggal</div>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{dateStr}</div>
                            </div>
                            <div style={{ background: 'var(--clr-gray-50)', padding: '12px', borderRadius: '8px' }}>
                              <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', marginBottom: '4px' }}>Kehadiran Siswa</div>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
                                <span style={{ color: 'var(--clr-success)' }}>{details.rekap.hadir} Hadir</span>
                                <span style={{ color: '#eab308' }}>{details.rekap.izin} Izin</span>
                                <span style={{ color: '#3b82f6' }}>{details.rekap.sakit} Sakit</span>
                                <span style={{ color: '#ef4444' }}>{details.rekap.alpa} Alpa</span>
                              </div>
                            </div>
                            <div style={{ background: 'var(--clr-gray-50)', padding: '12px', borderRadius: '8px' }}>
                              <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', marginBottom: '4px' }}>Total Setoran Hafalan</div>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{details.mems.length} Setoran</div>
                            </div>
                            <div style={{ background: 'var(--clr-gray-50)', padding: '12px', borderRadius: '8px' }}>
                              <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', marginBottom: '4px' }}>Catatan Singkat</div>
                              <div style={{ fontWeight: 500, fontSize: '14px' }}>{m.summary || '-'}</div>
                            </div>
                            </div>
                          </div>
                        )}

                        {/* 2. ABSENSI */}
                        {activeSubTab === 'absensi' && (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid var(--clr-gray-200)', textAlign: 'left', color: 'var(--clr-gray-500)' }}>
                                  <th style={{ padding: '8px' }}>No</th>
                                  <th style={{ padding: '8px' }}>Nama Siswa</th>
                                  <th style={{ padding: '8px' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {details.students.map((s: any, i: number) => {
                                  const attRecord = details.att.find((a: any) => a.student_id === s.id)
                                  const status = attRecord?.status || 'alpa'
                                  const color = status === 'hadir' ? 'var(--clr-success)' : status === 'izin' ? '#eab308' : status === 'sakit' ? '#3b82f6' : '#ef4444'
                                  return (
                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--clr-gray-100)' }}>
                                      <td style={{ padding: '8px', color: 'var(--clr-gray-500)' }}>{i + 1}</td>
                                      <td style={{ padding: '8px', fontWeight: 500 }}>{s.name}</td>
                                      <td style={{ padding: '8px' }}>
                                        <span style={{ color, fontWeight: 'bold', textTransform: 'capitalize' }}>{status}</span>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* 3. SETORAN HAFALAN */}
                        {activeSubTab === 'setoran' && (
                          details.mems.length === 0 ? (
                            <p style={{ color: 'var(--clr-gray-500)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Tidak ada setoran hafalan pada pertemuan ini.</p>
                          ) : (
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                  <tr style={{ borderBottom: '2px solid var(--clr-gray-200)', textAlign: 'left', color: 'var(--clr-gray-500)' }}>
                                    <th style={{ padding: '8px' }}>No</th>
                                    <th style={{ padding: '8px' }}>Nama Siswa</th>
                                    <th style={{ padding: '8px' }}>Surat</th>
                                    <th style={{ padding: '8px' }}>Ayat</th>
                                    <th style={{ padding: '8px' }}>Nilai</th>
                                    <th style={{ padding: '8px' }}>Catatan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {details.mems.map((mem: any, i: number) => {
                                    const student = details.students.find((s:any) => s.id === mem.student_id)
                                    return (
                                      <tr key={mem.id || i} style={{ borderBottom: '1px solid var(--clr-gray-100)' }}>
                                        <td style={{ padding: '8px', color: 'var(--clr-gray-500)' }}>{i + 1}</td>
                                        <td style={{ padding: '8px', fontWeight: 500 }}>{student?.name || 'Unknown'}</td>
                                        <td style={{ padding: '8px' }}>{mem.surah_name}</td>
                                        <td style={{ padding: '8px' }}>{mem.verse_start} - {mem.verse_end}</td>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{mem.score || '-'}</td>
                                        <td style={{ padding: '8px' }}>{mem.note || '-'}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )
                        )}

                        {/* 4. JURNAL */}
                        {activeSubTab === 'jurnal' && (
                          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} /> Catatan Guru / Jurnal Pembelajaran
                            </div>
                            <p style={{ color: '#92400e', fontSize: '14px', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                              {m.summary || 'Tidak ada catatan jurnal untuk pertemuan ini.'}
                            </p>
                          </div>
                        )}

                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
