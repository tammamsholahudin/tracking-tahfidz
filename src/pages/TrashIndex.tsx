import { useState, useEffect } from 'react'
import { Trash2, RefreshCcw, AlertTriangle, ShieldAlert } from 'lucide-react'
import { getTrashItems, restoreFromTrash, hardDeleteTrash, type TrashItem } from '@/lib/trash'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import styles from './TrashIndex.module.css'

export default function TrashIndex() {
  const { activeWorkspaceId, profile } = useAuthStore()
  const [items, setItems] = useState<TrashItem[]>([])
  const role = profile?.role === 'admin' ? 'Admin' : 'Guru'

  const loadItems = () => {
    // Auto-delete items older than 30 days
    const all = getTrashItems()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let cleaned = false
    const validItems = all.filter(item => {
      if (new Date(item.deleted_at) < thirtyDaysAgo) {
        cleaned = true
        // Hard delete from supabase
        hardDeleteTrash(item.id)
        return false
      }
      return item.guru_id === activeWorkspaceId || role === 'Admin'
    })

    if (cleaned) {
      toast('Beberapa data di Sampah berumur >30 hari dan dihapus otomatis', { icon: '🧹' })
    }
    
    setItems(validItems) // getTrashItems already sorted by newest
  }

  useEffect(() => {
    loadItems()
    window.addEventListener('local_cache_updated', loadItems)
    return () => window.removeEventListener('local_cache_updated', loadItems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId, role])

  const toggleRole = () => {
    toast('Simulasi role telah dimatikan. Menggunakan role asli dari akun Anda.', { icon: 'ℹ️' })
  }

  const handleRestore = (id: string) => {
    if (confirm('Pulihkan data ini beserta seluruh relasinya?')) {
      restoreFromTrash(id)
      toast.success('Data berhasil dipulihkan')
      loadItems()
    }
  }

  const [filterType, setFilterType] = useState<string>('semua')
  
  const FILTER_OPTIONS = [
    { value: 'semua', label: 'Semua' },
    { value: 'tahfidz_teachers', label: 'Guru' },
    { value: 'tahfidz_students', label: 'Siswa' },
    { value: 'tahfidz_classes', label: 'Kelas' },
    { value: 'tahfidz_meetings', label: 'Pertemuan' },
    { value: 'tahfidz_attendance_records', label: 'Absensi' },
    { value: 'tahfidz_memorization_records', label: 'Setoran Hafalan' },
    { value: 'tahfidz_schedules', label: 'Jadwal' },
  ]

  const filteredItems = items.filter(i => filterType === 'semua' || i.original_table === filterType)

  const handleHardDelete = (id: string) => {
    if (role !== 'Admin') {
      toast.error('Hanya Admin yang dapat menghapus permanen!')
      return
    }
    
    if (confirm('PERINGATAN! Data akan dihapus permanen dan tidak dapat dipulihkan. Lanjutkan?')) {
      const input = prompt('Ketik "HAPUS" untuk mengonfirmasi penghapusan permanen:')
      if (input === 'HAPUS') {
        hardDeleteTrash(id)
        toast.success('Data dihapus permanen')
        loadItems()
      } else {
        toast.error('Konfirmasi gagal, data tidak dihapus.')
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
      tahfidz_memorization_records: 'Setoran Hafalan',
      tahfidz_schedules: 'Jadwal',
      tahfidz_targets: 'Target Hafalan',
      tahfidz_teachers: 'Guru',
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
            <p className={styles.subtitle}>Data yang dihapus akan tersimpan di sini. Semua fungsi recovery dipusatkan di sini.</p>
          </div>
          <button 
            onClick={toggleRole} 
            className={styles.roleBtn}
            title="Klik untuk mengubah simulasi role"
          >
            <ShieldAlert size={16} /> Mode Akses: <strong>{role}</strong>
          </button>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: filterType === opt.value ? 'var(--clr-primary-600)' : 'var(--clr-gray-200)',
                background: filterType === opt.value ? 'var(--clr-primary-50)' : 'white',
                color: filterType === opt.value ? 'var(--clr-primary-700)' : 'var(--clr-gray-600)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          <Trash2 size={48} color="var(--clr-gray-300)" />
          <p>Keranjang sampah kosong untuk filter ini.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Data</th>
                <th>Jenis Data</th>
                <th>Tanggal Dihapus</th>
                <th>Dihapus Oleh</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                  <td>
                    <span className={styles.badge}>{formatTableLabel(item.original_table)}</span>
                  </td>
                  <td>{formatDate(item.deleted_at)}</td>
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
