import { useState, useEffect } from 'react'
import { X, Save, Edit2 } from 'lucide-react'
import { mutateData } from '@/lib/db'
import toast from 'react-hot-toast'
import styles from './AddClassModal.module.css'

interface EditStudentModalProps {
  studentData: any
  entityType?: string
  onClose: () => void
  onSuccess: () => void
}

export default function EditStudentModal({ studentData, entityType = 'sekolah', onClose, onSuccess }: EditStudentModalProps) {
  const [name, setName] = useState(studentData?.name || '')
  const [nis, setNis] = useState(studentData?.nis || '')
  const [nisn, setNisn] = useState(studentData?.nisn || '')
  const [gender, setGender] = useState<'L' | 'P'>(studentData?.gender || 'L')
  const [birthDate, setBirthDate] = useState(studentData?.birth_date || '')
  const [parentName, setParentName] = useState(studentData?.parent_name || '')
  const [parentPhone, setParentPhone] = useState(studentData?.parent_phone || '')
  const [address, setAddress] = useState(studentData?.address || '')
  const [note, setNote] = useState(studentData?.note || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updatedStudent = {
        id: studentData.id,
        name,
        nis,
        nisn,
        gender,
        birth_date: birthDate,
        parent_name: parentName,
        parent_phone: parentPhone,
        address,
        note,
      }

      const tableKey = entityType === 'sekolah' ? 'tahfidz_students' : 'tahfidz_lesson_students'
      await mutateData('students', 'UPDATE', updatedStudent, tableKey)

      toast.success(`Data siswa ${name} berhasil diperbarui!`)
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Gagal memperbarui data siswa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}><Edit2 size={20} /> Edit Data Siswa</h2>
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
            {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
          </button>
        </form>
      </div>
    </div>
  )
}
