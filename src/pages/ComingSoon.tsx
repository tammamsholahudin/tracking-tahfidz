import { BookOpen, Construction } from 'lucide-react'

interface ComingSoonProps {
  title: string
  description?: string
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)',
      textAlign: 'center',
      gap: 'var(--space-4)',
    }}>
      <div style={{
        width: 80, height: 80,
        background: 'var(--clr-primary-50)',
        borderRadius: 'var(--radius-2xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--space-2)',
      }}>
        <BookOpen size={36} color="var(--clr-primary-600)" />
      </div>
      <h1 style={{
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--font-bold)',
        color: 'var(--clr-gray-800)',
      }}>{title}</h1>
      <p style={{
        fontSize: 'var(--text-base)',
        color: 'var(--clr-gray-500)',
        maxWidth: 400,
      }}>
        {description ?? 'Halaman ini sedang dalam pengembangan. Akan segera hadir!'}
      </p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        background: 'var(--clr-warning-bg)',
        color: 'var(--clr-warning)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
      }}>
        <Construction size={16} />
        Sedang dibangun
      </div>
    </div>
  )
}
