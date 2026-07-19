import { useState, useEffect } from 'react'
import { Trash2, RefreshCcw, AlertTriangle, ShieldAlert } from 'lucide-react'
import { getTrashItems, restoreFromTrash, hardDeleteTrash, type TrashItem } from '@/lib/trash'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import styles from './TrashIndex.module.css'

export default function TrashIndex() {
  const { activeWorkspaceId } = useAuthStore()
  const [items, setItems] = useState<TrashItem[]>([])
  const [role, setRole] = useState(localStorage.getItem('tahfidz_role') || 'Admin')

  const loadItems = () => {
    // Auto-delete items older than 30 days
    const all = getTrashItems()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let cleaned = false
    const validItems = all.filter(item => {
      if (new Date(item.deleted_at) < thirtyDaysAgo) {
        cleaned = true
        return false
      }
      return item.data?.guru_id === activeWorkspaceId
    })

    if (cleaned) {
      localStorage.setItem('tahfidz_trash', JSON.stringify(validItems))
      toast('Beberapa data di Sampah berumur >30 hari dan dihapus otomatis', { icon: '🧹' })
    }
    
    setItems(validItems.reverse()) // newest first
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId])

  const toggleRole = () => {
    const newRole = role === 'Admin' ? 'Guru' : 'Admin'
    localStorage.setItem('tahfidz_role', newRole)
    setRole(newRole)
    toast.success(`Role disimulasikan sebagai: ${newRole}`)
  }

  const handleRestore = (id: string) => {
    if (confirm('Pulihkan data ini beserta seluruh relasinya?')) {
      restoreFromTrash(id, role)
      toast.success('Data berhasil dipulihkan')
      loadItems()
    }
  }

  const handleHardDelete = (id: string) => {
    if (role !== 'Admin') {
      toast.error('Hanya Admin yang dapat menghapus permanen!')
      return
    }
    
    if (confirm('PERINGATAN! Data akan dihapus permanen. Lanjutkan?')) {
      if (confirm('Konfirmasi kedua: Apakah Anda benar-benar yakin? (Tindakan ini tidak bisa dibatalkan)')) {
        hardDeleteTrash(id, role)
        toast.success('Data dihapus permanen')
        loadItems()
      }
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const formatTableLabel = (table: string) => {
    const map: Record<string, string> = {
      tahfidz_classes: 'Kelas',
      tahfidz_students: 'Siswa',
      tahfidz_meetings: 'Pertemuan',
      tahfidz_attendance_records: 'Absensi',
      tahfidz_memorization_records: 'Setoran',
      tahfidz_schedules: 'Jadwal',
      tahfidz_targets: 'Target Hafalan',
      tahfidz_lesson_groups: 'Grup Les',
      tahfidz_private_students: 'Siswa Privat'
    }
    return map[table] || table
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className={styles.title}><Trash2 size={24} /> Sampah (Recycle Bin)</h2>
            <p className={styles.subtitle}>Data yang dihapus akan tersimpan di sini selama 30 hari sebelum dihapus permanen.</p>
          </div>
          <button 
            onClick={toggleRole} 
            className={styles.roleBtn}
            title="Klik untuk mengubah simulasi role"
          >
            <ShieldAlert size={16} /> Mode Akses: <strong>{role}</strong>
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <Trash2 size={48} color="var(--clr-gray-300)" />
          <p>Keranjang sampah kosong.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal Dihapus</th>
                <th>Jenis Data</th>
                <th>Nama / Deskripsi</th>
                <th>Dihapus Oleh</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{formatDate(item.deleted_at)}</td>
                  <td>
                    <span className={styles.badge}>{formatTableLabel(item.original_table)}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                  <td>{item.deleted_by}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actions}>
                      <button className={styles.btnRestore} onClick={() => handleRestore(item.id)}>
                        <RefreshCcw size={14} /> Pulihkan
                      </button>
                      <button 
                        className={styles.btnHardDelete} 
                        onClick={() => handleHardDelete(item.id)}
                        disabled={role !== 'Admin'}
                        style={{ opacity: role !== 'Admin' ? 0.5 : 1, cursor: role !== 'Admin' ? 'not-allowed' : 'pointer' }}
                      >
                        <AlertTriangle size={14} /> Hapus Permanen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
