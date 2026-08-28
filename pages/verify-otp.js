import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from 'components/AuthProvider';
import OtpInput from 'components/OtpInput';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const { identifier, next = '/tasks' } = router.query;

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!code || code.length < 6) return setError('Please enter the full verification code.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      await refetch();
      router.replace(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!identifier) {
    return <p className="empty">No identifier provided. Go back to <a href="/login">sign in</a>.</p>;
  }

  return (
    <section className="auth-card">
      <h1>Enter verification code</h1>
      <p className="auth-subtitle">We sent a 6-digit code to {identifier}.</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <OtpInput value={code} onChange={setCode} length={6} label="Verification code" />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Verifying…' : 'Verify & sign in'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <p className="resend-link">
        Didn't get the code? <a href="/login">Resend / change account</a>
      </p>
    </section>
  );
}
