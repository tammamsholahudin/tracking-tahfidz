import { useState, useRef, useEffect } from 'react'
import { Database, Download, Upload, ShieldCheck, Cloud, Loader2, Settings, ExternalLink, Unplug, HardDrive, RefreshCw } from 'lucide-react'
import { generateBackup, restoreBackup } from '@/lib/backup'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function BackupCenter() {
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin'
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  
  // Google Drive Mock State
  const [gdriveConnected, setGdriveConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  
  const [backupConfig, setBackupConfig] = useState({
    schedule: 'harian',
    time: '23:00',
    folder: 'Tracking Tahfidz Backup',
    retention: '25'
  })

  useEffect(() => {
    const savedStatus = localStorage.getItem('mock_gdrive_connected')
    if (savedStatus === 'true') {
      setGdriveConnected(true)
    }
    const savedConfig = localStorage.getItem('mock_gdrive_config')
    if (savedConfig) {
      setBackupConfig(JSON.parse(savedConfig))
    }
  }, [])

  const handleConnectGDrive = () => {
    setConnecting(true)
    setTimeout(() => {
      setGdriveConnected(true)
      localStorage.setItem('mock_gdrive_connected', 'true')
      setConnecting(false)
      toast.success('Berhasil terhubung ke Google Drive!')
    }, 1500)
  }

  const handleDisconnectGDrive = () => {
    if (!window.confirm('Yakin ingin memutuskan koneksi Google Drive?')) return
    setGdriveConnected(false)
    localStorage.removeItem('mock_gdrive_connected')
    toast.success('Koneksi Google Drive diputus.')
  }

  const handleSaveConfig = () => {
    localStorage.setItem('mock_gdrive_config', JSON.stringify(backupConfig))
    toast.success('Pengaturan Auto-Backup disimpan.')
  }

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

  const simulateGdriveAction = (msg: string) => {
    const toastId = toast.loading('Menghubungkan ke Google Drive...')
    setTimeout(() => {
      toast.success(msg, { id: toastId })
    }, 1500)
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
        
        {/* LOKAL BACKUP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ border: '1px solid var(--clr-gray-200)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Download size={20} color="var(--clr-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Buat Pencadangan Lokal</h3>
            </div>
            <p style={{ color: 'var(--clr-gray-600)', fontSize: '14px', marginBottom: '20px', flex: 1 }}>
              Unduh seluruh data ke penyimpanan lokal Anda.
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

          <div style={{ border: '1px solid var(--clr-gray-200)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Upload size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Pulihkan (Restore)</h3>
            </div>
            <p style={{ color: 'var(--clr-gray-600)', fontSize: '14px', marginBottom: '20px', flex: 1 }}>
              Impor file `.ttm` untuk mengembalikan data yang hilang secara aman.
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
            >
              {restoring ? <Loader2 className="animate-spin" size={18} /> : 'Pilih File .ttm & Restore'}
            </button>
            {!isAdmin && <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', marginTop: '8px', textAlign: 'center' }}><ShieldCheck size={12} style={{display:'inline', marginRight: 4}}/>Hanya Admin</div>}
          </div>
        </div>

        {/* GOOGLE DRIVE BACKUP */}
        <div style={{ border: '1px solid #c8e6c9', borderRadius: '12px', padding: '20px', background: '#f2fce3', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={24} color="#10b981" />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#065f46' }}>Google Drive Auto-Backup</h3>
            </div>
            {gdriveConnected ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#10b981', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', display: 'inline-block' }}></span>
                Terhubung
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', display: 'inline-block' }}></span>
                Belum Terhubung
              </span>
            )}
          </div>

          {!gdriveConnected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '20px 0' }}>
              <HardDrive size={48} color="#94a3b8" />
              <p style={{ color: '#475569', fontSize: '14px' }}>
                Hubungkan aplikasi ini dengan akun Google Drive Anda untuk pencadangan otomatis, aman, dan tanpa batas.
              </p>
              <button 
                onClick={handleConnectGDrive}
                disabled={connecting}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)' }}
              >
                {connecting ? <Loader2 className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                {connecting ? 'Menghubungkan...' : 'Hubungkan dengan Google'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Account Info */}
              <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>Admin Tahfidz MAM</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>admin.tahfidz@gmail.com</div>
                </div>
                <button onClick={handleDisconnectGDrive} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '4px' }} title="Putuskan Akun">
                  <Unplug size={18} />
                </button>
              </div>

              {/* Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Backup Terakhir</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', marginTop: '4px' }}>Hari ini, 06:00</div>
                </div>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Backup Berikutnya</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', marginTop: '4px' }}>Besok, {backupConfig.time}</div>
                </div>
              </div>

              {/* Settings Form */}
              <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Settings size={16} /> Pengaturan Auto-Backup
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#475569' }}>Frekuensi</label>
                    <select 
                      value={backupConfig.schedule}
                      onChange={e => setBackupConfig({...backupConfig, schedule: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="harian">Harian</option>
                      <option value="mingguan">Mingguan</option>
                      <option value="bulanan">Bulanan</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#475569' }}>Jam (WIB)</label>
                    <input 
                      type="time" 
                      value={backupConfig.time}
                      onChange={e => setBackupConfig({...backupConfig, time: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#475569' }}>Retensi Backup (Hapus otomatis versi lama)</label>
                  <select 
                    value={backupConfig.retention}
                    onChange={e => setBackupConfig({...backupConfig, retention: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="10">Simpan 10 Backup Terakhir</option>
                    <option value="25">Simpan 25 Backup Terakhir</option>
                    <option value="50">Simpan 50 Backup Terakhir</option>
                    <option value="unlimited">Tidak Pernah Hapus</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#475569' }}>Folder Google Drive</label>
                  <input 
                    type="text" 
                    value={backupConfig.folder}
                    onChange={e => setBackupConfig({...backupConfig, folder: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <button onClick={handleSaveConfig} style={{ width: '100%', padding: '8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  Simpan Pengaturan
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button onClick={() => simulateGdriveAction('Memulai backup ke Google Drive...')} style={{ padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <Cloud size={16} /> Backup Skrg
                </button>
                <button onClick={() => simulateGdriveAction('Mengambil data restore dari Google Drive...')} style={{ padding: '8px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={16} /> Restore 
                </button>
                <button onClick={() => window.open('https://drive.google.com', '_blank')} style={{ padding: '8px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <ExternalLink size={16} /> Buka Folder
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
