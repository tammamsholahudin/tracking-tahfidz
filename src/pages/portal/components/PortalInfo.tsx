import { Info, Calendar as CalendarIcon, Link2, Shield, Eye, Clock } from 'lucide-react'

interface PortalInfoProps {
  portalMeta: any
}

export default function PortalInfo({ portalMeta }: PortalInfoProps) {
  
  const InfoCard = ({ title, value, icon: Icon, color }: any) => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid var(--clr-gray-200)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--clr-gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-gray-900)' }}>{value}</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ width: '64px', height: '64px', background: 'var(--clr-primary-50)', color: 'var(--clr-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Info size={32} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--clr-gray-900)' }}>Informasi Portal</h2>
        <p style={{ color: 'var(--clr-gray-500)', fontSize: '15px', marginTop: '8px', maxWidth: '500px', margin: '8px auto 0' }}>
          Detail keamanan dan informasi teknis mengenai portal ini.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid var(--clr-gray-200)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <InfoCard 
            title="Nama Portal" 
            value={portalMeta.portal_name} 
            icon={Link2} 
            color="#3b82f6" 
          />
          <InfoCard 
            title="Jenis Portal" 
            value={portalMeta.entity_type === 'wali_kelas' ? 'Portal Wali Kelas' : 'Portal Kepala Sekolah'} 
            icon={Shield} 
            color="#10b981" 
          />
          <InfoCard 
            title="Tanggal Dibuat" 
            value={new Date(portalMeta.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} 
            icon={CalendarIcon} 
            color="#6366f1" 
          />
          <InfoCard 
            title="Tanggal Kadaluarsa" 
            value={portalMeta.expires_at ? new Date(portalMeta.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tidak Berakhir'} 
            icon={Clock} 
            color="#f59e0b" 
          />
          {portalMeta.total_visits !== undefined && (
            <InfoCard 
              title="Total Kunjungan" 
              value={`${portalMeta.total_visits} kali diakses`} 
              icon={Eye} 
              color="#ec4899" 
            />
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-gray-900)', marginBottom: '12px' }}>Catatan Ekstra</h3>
          <div style={{ background: 'var(--clr-gray-50)', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-gray-200)', color: 'var(--clr-gray-700)', fontSize: '14px', lineHeight: 1.6 }}>
            {portalMeta.notes ? (
              <span style={{ fontStyle: 'italic' }}>"{portalMeta.notes}"</span>
            ) : (
              <span style={{ color: 'var(--clr-gray-400)' }}>Tidak ada catatan.</span>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
