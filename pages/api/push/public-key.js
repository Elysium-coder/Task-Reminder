// Returns the VAPID public key so the browser can ask for notification
// permission and create a PushSubscription. Does NOT import web-push so no
// native/VAPID setup cost is incurred just to read the key.
export default function handler(req, res) {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
}
