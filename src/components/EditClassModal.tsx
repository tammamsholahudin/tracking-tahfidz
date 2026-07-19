import { useState } from 'react'
import { X, Save, Edit3, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { moveToTrash } from '@/lib/trash'
import toast from 'react-hot-toast'
import styles from './AddClassModal.module.css' // Reuse the same CSS

interface EditClassModalProps {
  classData: any
  onClose: () => void
  onSuccess: () => void
}

export default function EditClassModal({ classData, onClose, onSuccess }: EditClassModalProps) {
  const [name, setName] = useState(classData.name || '')
  const [homeroomTeacher, setHomeroomTeacher] = useState(classData.homeroom_teacher || '')
  const [gradeLevel, setGradeLevel] = useState(classData.grade_level || '3')
  const [semester] = useState(classData.semester || 'Ganjil')
  const [academicYear, setAcademicYear] = useState(classData.academic_year || '2026/2027')
  const [notes, setNotes] = useState(classData.notes || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama kelas tidak boleh kosong')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('school_classes').update({
        name: name,
        homeroom_teacher: homeroomTeacher,
        grade_level: gradeLevel,
        semester: semester,
        notes: notes,
        academic_year: academicYear,
      }).eq('id', classData.id)

      if (error) {
        // Fallback to localStorage if Supabase fails or not configured
        const existing = JSON.parse(localStorage.getItem('tahfidz_classes') || '[]')
        const updated = existing.map((c: any) => 
          c.id === classData.id 
            ? { ...c, name, homeroom_teacher: homeroomTeacher, grade_level: gradeLevel, semester, notes, academic_year: academicYear } 
            : c
        )
        localStorage.setItem('tahfidz_classes', JSON.stringify(updated))
        
        toast.success('Disimulasikan (Lokal): Kelas berhasil diperbarui!')
        onSuccess()
        return
      }

      toast.success('Kelas berhasil diperbarui ke Database!')
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Gagal memperbarui kelas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    if (confirm('Hapus kelas ini? Data akan dipindahkan ke Sampah dan dapat dipulihkan dalam 30 hari.')) {
      moveToTrash('tahfidz_classes', classData.id, classData.name)
      toast.success('Kelas dipindahkan ke Sampah')
      onSuccess()
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}><Edit3 size={20} /> Edit Kelas</h2>
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
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <button type="button" className={styles.btnOutline} style={{ color: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }} onClick={handleDelete}>
              <Trash2 size={18} /> Hapus Kelas
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
