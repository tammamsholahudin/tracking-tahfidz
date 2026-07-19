import { useState } from 'react'
import { X, Save, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import styles from './AddClassModal.module.css'

interface AddStudentModalProps {
  entityId: string
  entityType?: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddStudentModal({ entityId, entityType = 'sekolah', onClose, onSuccess }: AddStudentModalProps) {
  const { activeWorkspaceId } = useAuthStore()
  const [name, setName] = useState('')
  const [nis, setNis] = useState('')
  const [nisn, setNisn] = useState('')
  const [gender, setGender] = useState<'L' | 'P'>('L')
  const [birthDate, setBirthDate] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newStudent = {
        id: `stu-${Date.now()}`,
        class_id: entityType === 'sekolah' ? entityId : null,
        group_id: entityType === 'les' ? entityId : null,
        guru_id: activeWorkspaceId,
        name,
        nis,
        nisn,
        gender,
        birth_date: birthDate,
        parent_name: parentName,
        parent_phone: parentPhone,
        address,
        note,
        progress: 0,
        last_surah: 'An-Naba',
        last_verse: 1,
        attendance: 'hadir',
        created_at: new Date().toISOString()
      }

      if (entityType === 'sekolah') {
        const existing = JSON.parse(localStorage.getItem('tahfidz_students') || '[]')
        localStorage.setItem('tahfidz_students', JSON.stringify([...existing, newStudent]))
      } else if (entityType === 'les') {
        const existing = JSON.parse(localStorage.getItem('tahfidz_lesson_students') || '[]')
        localStorage.setItem('tahfidz_lesson_students', JSON.stringify([...existing, newStudent]))
      }

      toast.success(`Siswa ${name} berhasil ditambahkan!`)
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Gagal menambahkan siswa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}><UserPlus size={20} /> Tambah Siswa Baru</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.body}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Nama Lengkap Siswa</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">NIS</label>
              <input type="text" className="form-input" value={nis} onChange={e => setNis(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">NISN</label>
              <input type="text" className="form-input" value={nisn} onChange={e => setNisn(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Jenis Kelamin</label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value as any)}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Lahir</label>
              <input type="date" className="form-input" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Nama Orang Tua</label>
              <input type="text" className="form-input" value={parentName} onChange={e => setParentName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">No. HP Orang Tua</label>
              <input type="tel" className="form-input" value={parentPhone} onChange={e => setParentPhone(e.target.value)} />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Alamat</label>
              <textarea className="form-input" rows={2} value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Catatan Khusus (Opsional)</label>
              <textarea className="form-input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading} style={{ marginTop: 'var(--space-2)' }}>
            {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Data Siswa</>}
          </button>
        </form>
      </div>
    </div>
  )
}
