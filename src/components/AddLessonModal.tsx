import { useState } from 'react'
import { X, Save, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import styles from './AddClassModal.module.css' // Reusing CSS

interface AddLessonModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddLessonModal({ onClose, onSuccess }: AddLessonModalProps) {
  const { activeWorkspaceId } = useAuthStore()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama grup les tidak boleh kosong')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('lesson_groups').insert({
        name: name,
        teacher_id: 'default-teacher-id',
        is_active: true
      })

      if (error) {
        // Fallback to localStorage if Supabase fails
        const newGroup = {
          id: 'local-les-' + Date.now().toString(),
          name: name,
          guru_id: activeWorkspaceId,
          total_students: 0,
          is_active: true,
          schedule: 'Ahad Sore'
        }
        const existing = JSON.parse(localStorage.getItem('tahfidz_lesson_groups') || '[]')
        localStorage.setItem('tahfidz_lesson_groups', JSON.stringify([...existing, newGroup]))
        
        toast.success('Disimulasikan (Lokal): Grup Les berhasil ditambahkan!')
        onSuccess()
        return
      }

      toast.success('Grup Les berhasil ditambahkan ke Database!')
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Gagal menambahkan grup les')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}><BookOpen size={20} /> Tambah Grup Les</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.body}>
          <div className="form-group">
            <label className="form-label">Nama Grup Les</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: Les Tahfidz Ahad" 
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan ke Database</>}
          </button>
        </form>
      </div>
    </div>
  )
}
