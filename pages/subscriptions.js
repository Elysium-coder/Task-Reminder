import { useState } from 'react';
import { getServerSideUser, loginRedirect } from 'lib/ssr';
import { connectDB } from 'lib/mongodb';
import Subscription from 'lib/models/Subscription';
import NepaliDate from 'components/NepaliDate';

export async function getServerSideProps(context) {
  const user = await getServerSideUser(context);
  if (!user) return loginRedirect(context.resolvedUrl);
  await connectDB();
  const subs = await Subscription.find({ user: user.id })
    .sort({ createdAt: -1 })
    .lean();
  const initialSubs = subs.map((s) => ({
    id: s._id.toString(),
    provider: s.provider,
    amount: s.amount,
    currency: s.currency,
    transactionId: s.transactionId || '',
    status: s.status,
    adminApproved: s.adminApproved,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
  }));
  return { props: { initialUser: user, initialSubs } };
}

export default function SubscriptionsPage({ initialSubs }) {
  const [subs, setSubs] = useState(initialSubs || []);
  const [form, setForm] = useState({ provider: 'esewa', amount: 500, transactionId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSubs([data.subscription, ...subs]);
      setSuccess('Subscription request created. An admin will verify your payment.');
      setForm({ provider: 'esewa', amount: 500, transactionId: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page">
      <h1>Subscriptions</h1>

      <div className="create-sub">
        <h2>New subscription</h2>
        <form onSubmit={create} className="sub-form">
          <label>
            Provider
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            >
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
            </select>
          </label>
          <label>
            Amount (NPR)
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </label>
          <label>
            Transaction ID (optional)
            <input
              value={form.transactionId}
              onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
              placeholder="from the payment app"
            />
          </label>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Creating…' : 'Create subscription'}
          </button>
        </form>
      </div>

      <h2>Your subscriptions</h2>
      {!subs.length ? (
        <p className="empty">No subscriptions yet.</p>
      ) : (
        <table className="sub-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
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
                  {s.status}
                  {s.adminApproved && ' ✓ approved'}
                </td>
                <td>{s.createdAt && <NepaliDate date={s.createdAt} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </section>
  );
}
