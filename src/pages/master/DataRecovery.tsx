import { useState, useEffect } from 'react'
import { Database, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react'
import { getSync, mutateData } from '@/lib/db'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function DataRecovery() {
  const { profile } = useAuthStore()
  const [orphans, setOrphans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    scanOrphans()
  }, [])

  const scanOrphans = () => {
    setLoading(true)
    try {
      const allMeetings = getSync('tahfidz_meetings') || []
      const meetingIds = new Set(allMeetings.map((m: any) => m.id))
      
      const allAtt = getSync('tahfidz_attendance_records') || []
      const allTeachers = getSync('tahfidz_teachers') || []
      const allClasses = getSync('tahfidz_classes') || []

      const missingMap = new Map()

      // Scan from attendance
      allAtt.forEach((att: any) => {
        if (att.meeting_id && !meetingIds.has(att.meeting_id)) {
          if (!missingMap.has(att.meeting_id)) {
            missingMap.set(att.meeting_id, {
              id: att.meeting_id,
              date: att.created_at || new Date().toISOString(),
              class_id: att.class_id,
              guru_id: att.guru_id,
              attCount: 0,
              memCount: 0
            })
          }
          missingMap.get(att.meeting_id).attCount++
        }
      })

      // Scan from memorization (though mem doesn't explicitly store meeting_id, if they do in future)
      // Currently memorization_records don't have meeting_id in Tahfidz MAM, they have date.
      // But we will still allow restoring the meeting from attendance.

      const orphansList = Array.from(missingMap.values()).map(o => {
        const cls = allClasses.find((c:any) => c.id === o.class_id)
        const teacher = allTeachers.find((t:any) => t.id === o.guru_id)
        return {
          ...o,
          className: cls ? cls.name : 'Unknown Class',
          teacherName: teacher ? teacher.name : 'Unknown Teacher'
        }
      })

      // Sort by date desc
      orphansList.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setOrphans(orphansList)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (orphan: any) => {
    if (!confirm('Peringatan: Aksi ini akan membuat ulang data pertemuan yang hilang agar relasi absensi/setoran kembali tampil di aplikasi. Lanjutkan?')) return
    
    // Check if it already exists (prevent duplicate)
    const currentMeetings = getSync('tahfidz_meetings') || []
    if (currentMeetings.find((m: any) => m.id === orphan.id)) {
      toast.error('Data pertemuan ini sudah ada di database!')
      scanOrphans() // refresh
      return
    }

    const newMeeting = {
      id: orphan.id,
      class_id: orphan.class_id,
      guru_id: orphan.guru_id || profile?.id,
      date: orphan.date,
      summary: 'Data hasil pemulihan otomatis (Recovered)',
      status: 'Pembelajaran',
      created_at: orphan.date
    }

    try {
      await mutateData('meetings', 'INSERT', newMeeting, 'tahfidz_meetings')
      toast.success('Data pertemuan berhasil dipulihkan!')
      scanOrphans()
    } catch (e) {
      toast.error('Gagal memulihkan data pertemuan.')
      console.error(e)
    }
  }

  return (
    <div className="page-enter">
      <div style={{ background: 'white', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--clr-gray-200)', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: '0 0 var(--space-2) 0' }}>
          <Database size={24} color="var(--clr-primary-600)" /> 
          Recovery Data (Pemulihan Data Yatim/Orphan)
        </h2>
        <p style={{ color: 'var(--clr-gray-500)', fontSize: 'var(--text-sm)', margin: 0, lineHeight: 1.5 }}>
          Fitur ini akan memindai data absensi dan setoran hafalan yang kehilangan referensi Induk Pertemuan (tabel meetings kosong/terhapus). 
          Jika ditemukan, Anda dapat memulihkannya sehingga data tersebut muncul kembali di Laporan dan Rekapitulasi Kelas.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <button className="btn-primary" onClick={scanOrphans} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 
          Pindai Ulang
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--clr-gray-200)', overflow: 'hidden' }}>
        {orphans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--clr-gray-400)' }}>
            <CheckCircle2 size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>Database Sehat</div>
            <div>Tidak ditemukan data yatim (orphan data) yang perlu dipulihkan.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--clr-gray-200)', background: 'var(--clr-gray-50)', textAlign: 'left' }}>
                  <th style={{ padding: '12px var(--space-4)' }}>Meeting ID</th>
                  <th style={{ padding: '12px' }}>Tanggal</th>
                  <th style={{ padding: '12px' }}>Kelas</th>
                  <th style={{ padding: '12px' }}>Guru</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Total Absensi</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orphans.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--clr-gray-100)' }}>
                    <td style={{ padding: '12px var(--space-4)', fontFamily: 'monospace', color: 'var(--clr-gray-500)', fontSize: '11px' }}>{o.id}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{new Date(o.date).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</td>
                    <td style={{ padding: '12px' }}>{o.className}</td>
                    <td style={{ padding: '12px' }}>{o.teacherName}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{o.attCount}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 'bold' }}>
                        <AlertTriangle size={12} /> ORPHAN
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleRestore(o)}
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
