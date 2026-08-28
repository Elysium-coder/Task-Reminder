import webpush from 'web-push';

let initialized = false;

function init() {
  if (initialized) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (pub && priv) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:you@example.com', pub, priv);
    initialized = true;
  }
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || '';
}

/**
 * Send a push notification to a single subscription object as produced by the
 * browser Push API.
 */
export async function sendPushNotification(subscription, payload) {
  init();
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    const err = new Error('VAPID keys are not configured.');
    err.status = 502;
    throw err;
  }
  return webpush.sendNotification(subscription, JSON.stringify(payload || {}), {
    TTL: 60,
  });
}

/** Send a push notification to every stored subscription for a user id. */
export async function sendPushToUser(userId, payload) {
  const PushSubscription = (await import('./models/PushSubscription')).default;
  const subs = await PushSubscription.find({ user: userId }).lean();
  const results = [];
  for (const sub of subs) {
    try {
      const subobj = JSON.parse(sub.raw);
      await sendPushNotification(subobj, payload);
      results.push({ endpoint: sub.endpoint, ok: true });
    } catch (e) {
      // The subscription may have expired — clean it up.
      await PushSubscription.deleteOne({ _id: sub._id });
      results.push({ endpoint: sub.endpoint, ok: false, error: e.message });
    }
  }
  return results;
}

export default sendPushNotification;
