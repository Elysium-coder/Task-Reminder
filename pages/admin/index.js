import { useState, useEffect } from 'react';
import { requirePageAuthAdmin } from 'lib/ssr';
import NepaliDate from 'components/NepaliDate';

export async function getServerSideProps(context) {
  return requirePageAuthAdmin(context);
}

export default function AdminPage({ initialUser }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/subscriptions?status=pending');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load subscriptions');
      setSubs(data.subscriptions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    const res = await fetch('/api/admin/subscriptions/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Failed');
    setSubs((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="page">
      <h1>Admin panel</h1>
      <p>
        Signed in as <strong>{initialUser?.email}</strong> (admin).
      </p>

      <h2>Pending subscription approvals</h2>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <>
          {!subs.length ? (
            <p className="empty">No pending subscriptions.</p>
          ) : (
            <table className="sub-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Amount</th>
                  <th>User</th>
                  <th>Txn ID</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td>{s.provider}</td>
                    <td>
                      {s.amount} {s.currency}
                    </td>
                    <td>
                      {s.user?.email || s.user?.phone || '—'}
                    </td>
                    <td>{s.transactionId || '—'}</td>
                    <td>{s.createdAt && <NepaliDate date={s.createdAt} />}</td>
                    <td>
                      <button
                        onClick={() => approve(s.id)}
                        className="btn btn-primary"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
