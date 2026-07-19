import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif',
          background: '#f8fafc', color: '#334155'
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#dc2626' }}>Ups! Terjadi Kesalahan</h1>
          <p style={{ marginBottom: '20px', maxWidth: '400px', lineHeight: '1.5' }}>
            {this.state.error?.message?.includes('Failed to fetch dynamically imported module') 
              ? 'Aplikasi baru saja diperbarui ke versi terbaru. Silakan muat ulang halaman.'
              : 'Terjadi kesalahan sistem saat memuat tampilan ini.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px', background: '#0284c7', color: 'white', border: 'none', 
              borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
