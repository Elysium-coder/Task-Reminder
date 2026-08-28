import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
      <h2 style={{ margin: '0.5rem 0 1rem' }}>Page not found</h2>
      <p style={{ color: '#666', maxWidth: 420 }}>
        The page you are looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
        Go back home
      </Link>
    </div>
  );
}
