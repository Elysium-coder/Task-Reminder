import Link from 'next/link';
import { useAuth } from 'components/AuthProvider';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <Link href="/" className="brand">
        Task Reminder
      </Link>
      <div className="nav-actions">
        {user && (
          <>
            <Link href="/tasks">My Tasks</Link>
            <Link href="/notifications">Notifications</Link>
            <Link href="/subscriptions">Subscriptions</Link>
            {user.role === 'admin' && <Link href="/admin">Admin</Link>}
            <Link href="/profile">Profile</Link>
          </>
        )}
        {!user && !loading && <Link href="/login">Sign in</Link>}
        {user && (
          <button type="button" onClick={handleLogout} className="btn btn-ghost">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
