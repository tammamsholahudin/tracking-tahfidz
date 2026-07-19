import { useState } from 'react'
import { X, Save, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import styles from './AddClassModal.module.css'

interface AddClassModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddClassModal({ onClose, onSuccess }: AddClassModalProps) {
  const { activeWorkspaceId } = useAuthStore()
  const [name, setName] = useState('')
  const [academicYear, setAcademicYear] = useState('2026/2027')
  const [loading, setLoading] = useState(false)

  const [homeroomTeacher, setHomeroomTeacher] = useState('')
  const [gradeLevel, setGradeLevel] = useState('3')
  const [semester] = useState('Ganjil')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama kelas tidak boleh kosong')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('school_classes').insert({
        name: name,
        teacher_id: 'default-teacher-id',
        homeroom_teacher: homeroomTeacher,
        grade_level: gradeLevel,
        semester: semester,
        notes: notes,
        academic_year: academicYear,
        total_students: 0,
        is_active: true
      })

      if (error) {
        const newClass = {
          id: 'local-' + Date.now().toString(),
          name: name,
          guru_id: activeWorkspaceId,
          homeroom_teacher: homeroomTeacher,
          grade_level: gradeLevel,
          semester: semester,
          notes: notes,
          total_students: 0,
          academic_year: academicYear,
          progress: 0,
          is_active: true
        }
        const existing = JSON.parse(localStorage.getItem('tahfidz_classes') || '[]')
        localStorage.setItem('tahfidz_classes', JSON.stringify([...existing, newClass]))
        
        toast.success('Disimulasikan (Lokal): Kelas berhasil ditambahkan!')
        onSuccess()
        return
      }

      toast.success('Kelas berhasil ditambahkan ke Database!')
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Gagal menambahkan kelas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}><BookOpen size={20} /> Tambah Kelas Baru</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.body}>
          <div className="form-group">
            <label className="form-label">Nama Kelas</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: Kelas 3 Bilal" 
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nama Wali Kelas</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: Ust. Ahmad Fauzi" 
              value={homeroomTeacher}
              onChange={e => setHomeroomTeacher(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">Tingkat</label>
              <select className="form-select" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}>
                {[1,2,3,4,5,6].map(lvl => (
                  <option key={lvl} value={lvl}>Kelas {lvl}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tahun Ajaran</label>
            <select 
              className="form-select"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
              <option value="2028/2029">2028/2029</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Keterangan (Opsional)</label>
            <textarea 
              className="form-textarea" 
              placeholder="Keterangan tambahan kelas..." 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Kelas</>}
          </button>
        </form>
      </div>
    </div>
  )
}
