import { useState, useEffect } from 'react'
import { Database, HardDrive, Image as ImageIcon, FileText, LayoutDashboard, Cloud, Users, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function StorageDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    db: 0,
    backup: 0,
    portal: 0,
    foto: 0,
    dokumen: 0,
    perGuru: 0,
    perKelas: 0,
    perSiswa: 0
  })

  useEffect(() => {
    const getByteSize = (str: string) => new Blob([str]).size;
    let dbSize = 0;
    
    // Calculate total DB size
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('tahfidz_') || key.startsWith('supabase'))) {
        dbSize += getByteSize(localStorage.getItem(key) || '')
      }
    }

    // Specific tables
    const teachersStr = localStorage.getItem('tahfidz_teachers') || '[]'
    const teachers = JSON.parse(teachersStr)
    const teachersSize = getByteSize(teachersStr)

    const classesStr = localStorage.getItem('tahfidz_classes') || '[]'
    const classes = JSON.parse(classesStr)
    const classesSize = getByteSize(classesStr)

    const studentsStr = localStorage.getItem('tahfidz_students') || '[]'
    const students = JSON.parse(studentsStr)
    const studentsSize = getByteSize(studentsStr)

    const portalStr = localStorage.getItem('tahfidz_portal_links') || '[]'
    const portalSize = getByteSize(portalStr)
    
    // For backups, assuming each local backup downloaded previously could be tracked, 
    // but since we only download ZIPs, we'll show size of backup settings queue.
    const offlineStr = localStorage.getItem('offline_queue') || '[]'
    const backupSize = getByteSize(offlineStr) + getByteSize(localStorage.getItem('mock_gdrive_config') || '')

    setStats({
      db: dbSize,
      backup: backupSize,
      portal: portalSize,
      foto: 0, // No actual photos stored in local DB
      dokumen: 0,
      perGuru: teachers.length ? teachersSize / teachers.length : 0,
      perKelas: classes.length ? classesSize / classes.length : 0,
      perSiswa: students.length ? studentsSize / students.length : 0,
    })
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalAllocated = 5 * 1024 * 1024 * 1024 // 5 GB
  const totalUsed = stats.db + stats.backup + stats.portal
  const usedPercent = ((totalUsed / totalAllocated) * 100).toFixed(4)
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-gray-50)' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid var(--clr-gray-200)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-gray-600)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>Storage Dashboard</h1>
          <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px' }}>Monitoring penggunaan ruang penyimpanan sistem.</p>
        </div>
      </header>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Main Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--clr-gray-600)', fontWeight: 600 }}>Total Storage Project</div>
              <Database size={20} color="#3b82f6" />
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a' }}>{formatBytes(totalUsed)}</div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(1, parseFloat(usedPercent))}%`, background: '#3b82f6', height: '100%' }}></div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{usedPercent}% terpakai dari 5 GB alokasi maksimal</div>
          </div>
          
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--clr-gray-600)', fontWeight: 600 }}>Storage Database</div>
              <HardDrive size={20} color="#10b981" />
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a' }}>{formatBytes(stats.db)}</div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '100%', background: '#10b981', height: '100%' }}></div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Akurasi asli dari basis data lokal (Teks & JSON)</div>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--clr-gray-600)', fontWeight: 600 }}>Storage Auto-Backup</div>
              <Cloud size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a' }}>{formatBytes(stats.backup)}</div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: stats.backup ? '100%' : '0%', background: '#f59e0b', height: '100%' }}></div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Ukuran antrean offline & metadata backup</div>
          </div>

        </div>

        {/* Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#0f172a' }}>Rincian Berdasarkan Tipe</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Storage Foto</span>
                    <span style={{ fontWeight: 600 }}>{formatBytes(stats.foto)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: '0%', background: '#d97706', height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Storage Dokumen</span>
                    <span style={{ fontWeight: 600 }}>{formatBytes(stats.dokumen)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: '0%', background: '#4f46e5', height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LayoutDashboard size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Storage Portal</span>
                    <span style={{ fontWeight: 600 }}>{formatBytes(stats.portal)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: stats.portal ? '100%' : '0%', background: '#15803d', height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#0f172a' }}>Penggunaan Entitas (Asli)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Storage per Guru (Rata-rata)</span>
                    <span style={{ fontWeight: 600 }}>{formatBytes(stats.perGuru)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: stats.perGuru ? '60%' : '0%', background: '#64748b', height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Storage per Kelas (Rata-rata)</span>
                    <span style={{ fontWeight: 600 }}>{formatBytes(stats.perKelas)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: stats.perKelas ? '40%' : '0%', background: '#64748b', height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Storage per Siswa (Rata-rata)</span>
                    <span style={{ fontWeight: 600 }}>{formatBytes(stats.perSiswa)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: stats.perSiswa ? '10%' : '0%', background: '#64748b', height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
