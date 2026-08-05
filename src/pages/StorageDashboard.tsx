import { Database, HardDrive, Image as ImageIcon, FileText, LayoutDashboard, Cloud, Users, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function StorageDashboard() {
  const navigate = useNavigate()
  
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
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a' }}>1.2 GB</div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '24%', background: '#3b82f6', height: '100%' }}></div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>24% terpakai dari 5 GB alokasi maksimal</div>
          </div>
          
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--clr-gray-600)', fontWeight: 600 }}>Storage Database</div>
              <HardDrive size={20} color="#10b981" />
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a' }}>145.2 MB</div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '60%', background: '#10b981', height: '100%' }}></div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Sangat efisien (Teks & JSON)</div>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--clr-gray-600)', fontWeight: 600 }}>Storage Auto-Backup</div>
              <Cloud size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a' }}>850 MB</div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '85%', background: '#f59e0b', height: '100%' }}></div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Berisi 25 file `.ttm` tersimpan</div>
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
                    <span style={{ fontWeight: 600 }}>320 MB</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: '45%', background: '#d97706', height: '100%', borderRadius: '3px' }}></div>
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
                    <span style={{ fontWeight: 600 }}>110 MB</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: '15%', background: '#4f46e5', height: '100%', borderRadius: '3px' }}></div>
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
                    <span style={{ fontWeight: 600 }}>25 MB</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: '5%', background: '#15803d', height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--clr-gray-200)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#0f172a' }}>Penggunaan Entitas (Simulasi)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Storage per Guru (Rata-rata)</span>
                    <span style={{ fontWeight: 600 }}>18.5 MB</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: '60%', background: '#64748b', height: '100%', borderRadius: '3px' }}></div>
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
                    <span style={{ fontWeight: 600 }}>12.2 MB</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: '40%', background: '#64748b', height: '100%', borderRadius: '3px' }}></div>
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
                    <span style={{ fontWeight: 600 }}>0.5 MB</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: '10%', background: '#64748b', height: '100%', borderRadius: '3px' }}></div>
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
