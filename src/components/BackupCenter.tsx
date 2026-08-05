import { useState, useRef } from 'react'
import { Database, Download, Upload, ShieldCheck, Cloud, Loader2 } from 'lucide-react'
import { generateBackup, restoreBackup } from '@/lib/backup'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function BackupCenter() {
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin'
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const handleExportAll = async () => {
    setExporting(true)
    toast.loading('Menyiapkan file backup...', { id: 'backup' })
    try {
      await generateBackup({ includeAll: true })
      toast.success('Backup berhasil diunduh', { id: 'backup' })
    } catch (err: any) {
      console.error(err)
      toast.error('Gagal membuat backup', { id: 'backup' })
    } finally {
      setExporting(false)
    }
  }

  const handleExportOwn = async () => {
    setExporting(true)
    toast.loading('Menyiapkan file backup personal...', { id: 'backup' })
    try {
      await generateBackup({ includeAll: false, guruId: profile?.id })
      toast.success('Backup personal berhasil diunduh', { id: 'backup' })
    } catch (err: any) {
      console.error(err)
      toast.error('Gagal membuat backup', { id: 'backup' })
    } finally {
      setExporting(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('PERINGATAN: Memulihkan backup akan memperbarui data secara paksa dengan data dari file backup. Lanjutkan?')) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setRestoring(true)
    toast.loading('Membaca file dan memulihkan data...', { id: 'restore' })
    
    try {
      const res = await restoreBackup(file)
      if (res.success) {
        toast.success(res.message, { id: 'restore' })
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error(res.message, { id: 'restore' })
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan tidak terduga', { id: 'restore' })
    } finally {
      setRestoring(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid var(--clr-gray-200)', marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--clr-primary-50)', color: 'var(--clr-primary-600)', padding: '10px', borderRadius: '8px' }}>
          <Database size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Pusat Pencadangan (Backup Center)</h2>
          <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>Amankan data Anda dengan format `.ttm` yang aman dan efisien.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
        
        <div style={{ border: '1px solid var(--clr-gray-200)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Download size={20} color="var(--clr-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Buat Pencadangan</h3>
          </div>
          <p style={{ color: 'var(--clr-gray-600)', fontSize: '14px', marginBottom: '20px', flex: 1 }}>
            Unduh seluruh data (Kelas, Siswa, Setoran, Absensi) ke penyimpanan lokal Anda.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button 
              onClick={handleExportOwn} 
              disabled={exporting}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--clr-primary)', background: '#fff', color: 'var(--clr-primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              Backup Data Milik Saya
            </button>
            {isAdmin && (
              <button 
                onClick={handleExportAll} 
                disabled={exporting}
                style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--clr-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                {exporting ? <Loader2 className="animate-spin" size={18} style={{ margin: '0 auto' }} /> : 'Backup Semua Data (Global)'}
              </button>
            )}
          </div>
        </div>

        <div style={{ border: '1px solid var(--clr-gray-200)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Upload size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Pulihkan (Restore)</h3>
          </div>
          <p style={{ color: 'var(--clr-gray-600)', fontSize: '14px', marginBottom: '20px', flex: 1 }}>
            Impor file `.ttm` untuk mengembalikan data yang hilang. Data akan dimasukkan secara aman.
          </p>
          <input 
            type="file" 
            accept=".ttm" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            id="restore-upload"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring || !isAdmin}
            style={{ padding: '10px', borderRadius: '8px', border: 'none', background: isAdmin ? '#f59e0b' : 'var(--clr-gray-200)', color: isAdmin ? '#fff' : 'var(--clr-gray-500)', fontWeight: 600, cursor: isAdmin ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center' }}
            title={!isAdmin ? 'Hanya Admin yang dapat memulihkan backup' : ''}
          >
            {restoring ? <Loader2 className="animate-spin" size={18} /> : 'Pilih File .ttm & Restore'}
          </button>
          {!isAdmin && <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', marginTop: '8px', textAlign: 'center' }}><ShieldCheck size={12} style={{display:'inline', marginRight: 4}}/>Hanya Admin</div>}
        </div>

        <div style={{ border: '1px solid var(--clr-gray-200)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Cloud size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Google Drive Auto-Backup</h3>
          </div>
          <p style={{ color: 'var(--clr-gray-600)', fontSize: '14px', marginBottom: '20px', flex: 1 }}>
            Cadangkan data otomatis ke Google Drive secara berkala. (Dalam peninjauan keamanan).
          </p>
          <button 
            disabled
            style={{ padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: 'transparent', color: 'var(--clr-gray-500)', fontWeight: 600, cursor: 'not-allowed' }}
          >
            Menunggu Setup Kredensial Google API
          </button>
        </div>

      </div>
    </div>
  )
}
