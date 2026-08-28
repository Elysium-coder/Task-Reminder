import Link from 'next/link';
import { useAuth } from 'components/AuthProvider';

export default function Home() {
  const { user } = useAuth();
  return (
    <section className="hero">
      <h1>Task Reminder</h1>
      <p className="hero-subtitle">
        Never miss a task again. Get reminders via push, email, and SMS.
      </p>
      <div className="hero-actions">
        {user ? (
          <Link href="/tasks" className="btn btn-primary">
            Go to my tasks
          </Link>
        ) : (
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
        )}
      </div>
    </section>
  );
}
