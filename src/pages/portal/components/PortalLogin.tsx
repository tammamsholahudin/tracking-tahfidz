import React from 'react'
import { Lock, Loader2, BookOpen } from 'lucide-react'

interface PortalLoginProps {
  password: string
  setPassword: (val: string) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function PortalLogin({ password, setPassword, loading, onSubmit }: PortalLoginProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--clr-primary-50) 0%, #ffffff 100%)', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '40px 32px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', maxWidth: '440px', width: '100%', border: '1px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--clr-primary-100) 0%, var(--clr-primary-50) 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--clr-primary)', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.15)' }}>
            <BookOpen size={40} strokeWidth={1.5} />
          </div>
          
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--clr-gray-900)', letterSpacing: '-0.5px' }}>
            Tracking Tahfidz <span style={{ color: 'var(--clr-primary)' }}>MAM!</span>
          </h1>
          <p style={{ color: 'var(--clr-gray-500)', marginTop: '8px', fontSize: '15px', fontWeight: 500 }}>
            Sistem Pemantauan Terpadu
          </p>
        </div>
        
        <div style={{ background: 'var(--clr-gray-50)', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid var(--clr-gray-200)', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--clr-gray-500)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>
            Autentikasi Aman
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--clr-gray-800)' }}>
            Portal Akses Pribadi
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-gray-400)' }} />
              <input 
                type="password" 
                placeholder="Masukkan Kata Sandi Portal" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ padding: '16px 16px 16px 48px', borderRadius: '12px', border: '2px solid var(--clr-gray-200)', fontSize: '16px', width: '100%', transition: 'all 0.2s', outline: 'none', background: '#fff' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--clr-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--clr-gray-200)'}
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
            style={{ padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s', transform: loading ? 'scale(0.98)' : 'scale(1)' }}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Buka Portal'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: 'var(--clr-gray-400)' }}>
          Portal ini dilindungi dengan enkripsi keamanan.<br/>
          Hanya pihak berwenang yang memiliki izin akses.
        </p>
      </div>
    </div>
  )
}
