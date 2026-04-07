// ═══════════════════════════════════════════════════════════════════════════
// synclulu DIGITAL OPERATING SYSTEM — Maintenance Page
// ═══════════════════════════════════════════════════════════════════════════

interface MaintenanceProps {
  message?: string;
  estimatedEnd?: string | null;
}

export default function Maintenance({ message, estimatedEnd }: MaintenanceProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1025 50%, #0a0a0f 100%)',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      {/* Animated pulse ring */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(160,132,232,0.3) 0%, transparent 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem',
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A084E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>

      <h1 style={{
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
        fontWeight: 700,
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #A084E8, #c4b5fd)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Wartungsarbeiten
      </h1>

      <p style={{
        fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
        color: 'rgba(255,255,255,0.7)',
        maxWidth: 480,
        lineHeight: 1.6,
        marginBottom: '1.5rem',
      }}>
        {message || 'Wir arbeiten gerade an Verbesserungen. Bitte versuche es in Kürze erneut.'}
      </p>

      {estimatedEnd && (
        <p style={{
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '2rem',
        }}>
          Voraussichtlich bis: {new Date(estimatedEnd).toLocaleString('de-DE')}
        </p>
      )}

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '0.8rem',
      }}>
        <span>synclulu</span>
        <span>·</span>
        <span>Voice-First Social</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
