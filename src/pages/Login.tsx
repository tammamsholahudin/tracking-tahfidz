import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import styles from './Login.module.css'


export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, user } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')


  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Email dan password wajib diisi.')
      return
    }
    const { error: authError } = await login(email, password)
    if (authError) {
      setError('Email atau password salah. Silakan coba lagi.')
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className={styles.page}>
      {/* Background ornament */}
      <div className={styles.bg}>
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
        <div className={styles.bgOrn1} />
        <div className={styles.bgOrn2} />
      </div>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <BookOpen size={28} color="white" />
          </div>
          <h1 className={styles.appName}>
            Tracking Tahfidz <span>MAM!</span>
          </h1>
          <p className={styles.tagline}>Administrasi Hafalan Digital</p>
          <p className={styles.arabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <h2 className={styles.formTitle}>Masuk ke Akun Anda</h2>



          {error && (
            <div className={styles.errorBox} role="alert">
              {error.split('\n').map((line, i) => <span key={i} style={{ display: 'block' }}>⚠️ {line}</span>)}
            </div>
          )}


          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="guru@sekolah.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className={styles.passWrap}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${styles.passInput}`}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.rememberRow}>
            <label className={styles.checkLabel}>
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkText}>Ingat Saya</span>
            </label>
          </div>

          <button
            id="btn-masuk"
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>

        <p className={styles.footer}>
          © 2026 Tracking Tahfidz MAM! · Semua hak dilindungi
        </p>
      </div>
    </div>
  )
}
