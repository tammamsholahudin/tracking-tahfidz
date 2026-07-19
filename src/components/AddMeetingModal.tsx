import { useState } from 'react'
import { X, Save, CalendarPlus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getSync, mutateData } from '@/lib/db'
import toast from 'react-hot-toast'
import styles from './AddClassModal.module.css'

interface AddMeetingModalProps {
  entityId: string
  entityType?: string
  entityName: string
  onClose: () => void
  onSuccess: () => void
}

const MEETING_STATUSES = [
  'Pembelajaran',
  'Guru Izin',
  'Guru Sakit',
  'Libur Nasional',
  'Libur Madrasah',
  'Ujian',
  'Asesmen',
  'Kegiatan Sekolah',
  'Class Meeting',
  'Hari Besar Islam',
  'Cuaca Buruk',
  'Bencana',
  'Lainnya'
]

export default function AddMeetingModal({ entityId, entityType = 'sekolah', entityName, onClose, onSuccess }: AddMeetingModalProps) {
  const { activeWorkspaceId } = useAuthStore()
  // Use today's date formatted as YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0]
  
  const [date, setDate] = useState(today)
  const [status, setStatus] = useState('Pembelajaran')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const existing = getSync('tahfidz_meetings')
      // Count existing meetings for this entity to auto-increment meeting number
      const entityMeetings = existing.filter((m: any) => 
        entityType === 'sekolah' ? m.class_id === entityId : m.entity_id === entityId
      )
      const meetingNumber = entityMeetings.length + 1

      const newMeeting = {
        id: `meet-${Date.now()}`,
        entity_id: entityId,
        entity_type: entityType,
        class_id: entityType === 'sekolah' ? entityId : null,
        guru_id: activeWorkspaceId,
        meeting_number: meetingNumber,
        date,
        status,
        status_note: note,
        created_at: new Date().toISOString()
      }

      await mutateData('meetings', 'INSERT', newMeeting, 'tahfidz_meetings')

      toast.success(`Pertemuan Ke-${meetingNumber} berhasil dibuat!`)
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Gagal membuat pertemuan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '500px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}><CalendarPlus size={20} /> Tambah Pertemuan</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.body}>
          <div style={{ background: 'var(--clr-gray-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: '500', marginBottom: 'var(--space-4)' }}>
            {entityType === 'sekolah' ? 'Kelas' : entityType === 'les' ? 'Grup Les' : 'Privat'}: {entityName}
          </div>

          <div className="form-group">
            <label className="form-label">Tanggal Pertemuan</label>
            <input 
              type="date" 
              className="form-input" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status Pertemuan</label>
            <select 
              className="form-select" 
              value={status} 
              onChange={e => setStatus(e.target.value)}
            >
              {MEETING_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {status !== 'Pembelajaran' && (
            <div className="form-group">
              <label className="form-label">Keterangan / Catatan</label>
              <textarea 
                className="form-input" 
                rows={3} 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                placeholder="Berikan alasan atau keterangan tambahan..."
                required
              />
            </div>
          )}

          <button type="submit" className={styles.btnPrimary} disabled={loading} style={{ marginTop: 'var(--space-4)' }}>
            {loading ? 'Menyimpan...' : <><Save size={18} /> Buat Pertemuan</>}
          </button>
        </form>
      </div>
    </div>
  )
}
