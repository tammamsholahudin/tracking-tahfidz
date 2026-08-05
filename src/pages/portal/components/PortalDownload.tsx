import { useState } from 'react'
import { Download, FileText, Table, Archive, Loader2, TrendingUp, BookOpen, Calendar, BookMarked } from 'lucide-react'
import toast from 'react-hot-toast'
import { downloadMassZip } from '@/lib/exportAll'
// In a real app we'd import specific pdf/excel generators here, e.g.:
// import { generateAttendancePDF, generateAttendanceExcel } from '@/lib/pdf' 
// Since we only have `downloadMassZip` working cleanly from the MVP, we will route all 
// specific requests to a "Coming Soon" or use the existing mass zip logic for now.

interface PortalDownloadProps {
  data: any
}

export default function PortalDownload({ data }: PortalDownloadProps) {
  const [loadingType, setLoadingType] = useState<string | null>(null)

  const handleDownloadAll = async () => {
    setLoadingType('all')
    try {
      toast.loading('Menyiapkan file ZIP...', { id: 'dl-all' })
      await downloadMassZip({
        classData: data.class_info,
        students: data.students || [],
        meetings: data.meetings || [],
        attendanceData: data.attendanceData || [],
        memorizationData: data.memorizationData || []
      })
      toast.success('Unduhan selesai!', { id: 'dl-all' })
    } catch (err: any) {
      console.error(err)
      toast.error('Gagal mengunduh ZIP', { id: 'dl-all' })
    } finally {
      setLoadingType(null)
    }
  }

  const handleSpecificDownload = (type: string, format: string) => {
    // For V1.2 MVP of specific downloads, we show a toast 
    // because building 8 distinct PDF/Excel exporters is out of scope for this UI redesign
    // We guide them to use 'Download Semua (ZIP)'.
    toast.error(`Fitur Download Spesifik ${type} (${format}) dalam pengembangan. Silakan gunakan "Download Semua (ZIP)".`, { duration: 4000 })
  }

  const DownloadCard = ({ title, description, icon: Icon }: any) => (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--clr-primary-50)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>{title}</h3>
          <div style={{ fontSize: '13px', color: 'var(--clr-gray-500)', marginTop: '2px' }}>{description}</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
        <button 
          onClick={() => handleSpecificDownload(title, 'PDF')}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--clr-gray-200)', background: '#fff', color: 'var(--clr-gray-700)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-gray-50)'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <FileText size={16} color="#ef4444" /> PDF
        </button>
        <button 
          onClick={() => handleSpecificDownload(title, 'Excel')}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--clr-gray-200)', background: '#fff', color: 'var(--clr-gray-700)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-gray-50)'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <Table size={16} color="#10b981" /> Excel
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid var(--clr-gray-200)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--clr-gray-900)' }}>Unduh Laporan Kelas</h2>
        <p style={{ color: 'var(--clr-gray-500)', fontSize: '14px', marginTop: '4px' }}>Export data portal ke dalam format PDF atau Excel yang siap cetak.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <DownloadCard title="Laporan Progress" description="Rekap ranking dan persentase hafalan" icon={TrendingUp} type="progress" />
        <DownloadCard title="Laporan Setoran" description="Detail riwayat setoran per siswa" icon={BookOpen} type="setoran" />
        <DownloadCard title="Laporan Absensi" description="Matriks kehadiran seluruh pertemuan" icon={Calendar} type="absensi" />
        <DownloadCard title="Laporan Jurnal" description="Cetak buku jurnal kelas per pertemuan" icon={BookMarked} type="jurnal" />
      </div>

      <div style={{ background: 'linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-primary-700) 100%)', borderRadius: '16px', padding: '32px', color: '#fff', display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Archive size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Download Semua Laporan</h3>
            <p style={{ opacity: 0.9, fontSize: '14px', marginTop: '4px', maxWidth: '400px' }}>Dapatkan seluruh laporan (Absensi, Progress, Setoran, Jurnal) sekaligus dalam satu file ZIP.</p>
          </div>
        </div>
        <button 
          onClick={handleDownloadAll}
          disabled={loadingType === 'all'}
          style={{ padding: '16px 24px', borderRadius: '12px', background: '#fff', color: 'var(--clr-primary)', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
        >
          {loadingType === 'all' ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          Download ZIP
        </button>
      </div>

    </div>
  )
}
