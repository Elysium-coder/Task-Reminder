import { useState } from 'react';
import { getServerSideUser, loginRedirect } from 'lib/ssr';
import { useAuth } from 'components/AuthProvider';

export async function getServerSideProps(context) {
  const user = await getServerSideUser(context);
  if (!user) return loginRedirect(context.resolvedUrl);
  return { props: { initialUser: user } };
}

export default function ProfilePage() {
  const { user, refetch } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      await refetch();
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page">
      <h1>Profile</h1>
      <p>
        <strong>Email:</strong> {user?.email}
      </p>
      <p>
        <strong>Phone:</strong> {user?.phone || '—'}
      </p>
      <form onSubmit={handleSubmit} className="profile-form">
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="input"
          />
        </label>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {error && <p className="error">{error}</p>}
        {saved && <p className="success">Profile updated.</p>}
      </form>
    </section>
  );
}
