import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from 'components/AuthProvider';
import { isValidEmail, looksLikePhone } from 'lib/validation';

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();
  const next = router.query.next || '/tasks';

  if (user) {
    router.replace(next);
    return null;
  }

  const [method, setMethod] = useState('email'); // 'email' | 'sms'
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDevCode('');
    if (method === 'email' && !isValidEmail(value)) return setError('Please enter a valid email address.');
    if (method === 'sms' && !looksLikePhone(value)) return setError('Please enter a valid phone number.');

    setSubmitting(true);
    try {
      const body = method === 'email' ? { email: value } : { phone: value };
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');

      setDevCode(data.code || '');
      router.push(
        `/verify-otp?identifier=${encodeURIComponent(value)}&method=${method}&next=${encodeURIComponent(next)}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-card">
      <h1>Sign in to Task Reminder</h1>
      <p className="auth-subtitle">
        Enter your email or phone number and we will send a one-time verification code.
      </p>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="toggle">
          <button
            type="button"
            className={method === 'email' ? 'active' : ''}
            onClick={() => setMethod('email')}
          >
            Email
          </button>
          <button
            type="button"
            className={method === 'sms' ? 'active' : ''}
            onClick={() => setMethod('sms')}
          >
            SMS
          </button>
        </div>
        <input
          type={method === 'email' ? 'email' : 'tel'}
          className="input"
          placeholder={method === 'email' ? 'you@example.com' : 'Phone number'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete={method === 'email' ? 'email' : 'tel'}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send verification code'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      {devCode && <p className="dev-code">Dev OTP code: {devCode}</p>}
    </section>
  );
}
