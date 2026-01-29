import type { Metadata } from 'next';

export const dynamic = 'error';

export const metadata: Metadata = {
  title: 'Building Status System',
  description: 'Secure property status monitoring system',
  robots: 'noindex, nofollow',
};

export default function RootPage() {
  return (
    <div className="container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ marginBottom: '1rem' }}>Building Status System</h1>
      <p style={{
        maxWidth: '600px',
        color: 'var(--text-secondary)',
        marginBottom: '2rem'
      }}>
        Access your property&apos;s status page using the unique link provided by your building management.
      </p>
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: 0 }}>
          Building administrators: Log in via your property-specific URL
        </p>
      </div>
    </div>
  );
}
