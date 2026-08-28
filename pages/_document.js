import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="description" content="Task Reminder — OTP auth, push/email/SMS reminders, paywall subscriptions." />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
