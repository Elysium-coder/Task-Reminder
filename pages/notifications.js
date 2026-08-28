import { useEffect, useState } from 'react';
import { getServerSideUser, loginRedirect } from 'lib/ssr';

export async function getServerSideProps(context) {
  const user = await getServerSideUser(context);
  if (!user) return loginRedirect(context.resolvedUrl);
  return { props: { initialUser: user } };
}

// Convert a base64 VAPID public key (URL-safe) to a Uint8Array for pushManager.
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64 || '').length % 4) % 4);
  const raw = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(raw);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

export default function NotificationsPage() {
  const [publicKey, setPublicKey] = useState('');
  const [status, setStatus] = useState('loading');
  const [loading, setLoading] = useState(false);
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  useEffect(() => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }
    // Register the service worker once (upgrades if an update exists).
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => loadKey())
      .catch(() => setStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  const loadKey = async () => {
    try {
      const res = await fetch('/api/push/public-key');
      const data = await res.json();
      setPublicKey(data.publicKey || '');
      check();
    } catch (e) {
      setStatus('error');
    }
  };

  const check = async () => {
    try {
      const sw = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.getSubscription();
      setStatus(sub ? 'subscribed' : 'not-subscribed');
    } catch (e) {
      setStatus('error');
    }
  };

  const subscribe = async () => {
    if (!publicKey) return setStatus('no-key');
    setLoading(true);
    try {
      const sw = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      setStatus('subscribed');
    } catch (e) {
      alert(e.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const sw = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unsubscribe: true }),
      });
      setStatus('not-subscribed');
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  let content;
  switch (status) {
    case 'loading':
      content = <p>Checking notification support…</p>;
      break;
    case 'unsupported':
      content = <p>This browser does not support push notifications.</p>;
      break;
    case 'error':
      content = <p>Something went wrong. Try again or use email/SMS reminders.</p>;
      break;
    case 'no-key':
      content = <p>VAPID keys are not configured on the server.</p>;
      break;
    case 'not-subscribed':
      content = (
        <button onClick={subscribe} disabled={loading} className="btn btn-primary">
          {loading ? 'Subscribing…' : 'Enable push notifications'}
        </button>
      );
      break;
    case 'subscribed':
      content = (
        <button onClick={unsubscribe} disabled={loading} className="btn btn-ghost">
          {loading ? 'Updating…' : 'Unsubscribe from push notifications'}
        </button>
      );
      break;
    default:
      content = null;
  }

  return (
    <section className="page">
      <h1>Notification settings</h1>
      {content}
      <p className="help">
        You will receive push reminders for tasks you opt into when creating or
        editing them. You can also enable email and SMS reminders per task.
      </p>
    </section>
  );
}
