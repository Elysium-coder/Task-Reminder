import Link from 'next/link';
import { useState } from 'react';
import { getServerSideUser, loginRedirect } from 'lib/ssr';
import { connectDB } from 'lib/mongodb';
import Task from 'lib/models/Task';
import NepaliDate from 'components/NepaliDate';

export async function getServerSideProps(context) {
  const user = await getServerSideUser(context);
  if (!user) return loginRedirect(context.resolvedUrl);
  await connectDB();
  const tasks = await Task.find({ user: user.id, completed: false })
    .sort({ createdAt: -1 })
    .lean();
  const initialTasks = tasks.map((t) => ({
    id: t._id.toString(),
    title: t.title,
    description: t.description,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    reminderAt: t.reminderAt ? new Date(t.reminderAt).toISOString() : null,
    completed: t.completed,
    reminded: t.reminded,
  }));
  return { props: { initialUser: user, initialTasks } };
}

export default function TasksPage({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  const toggleComplete = async (task) => {
    setLoadingId(task.id);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');
      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...t, completed: data.task.completed } : t
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    setLoadingId(id);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task');
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <h1>My Tasks</h1>
        <Link href="/tasks/new" className="btn btn-primary">
          + New task
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      {!tasks.length ? (
        <p className="empty">
          You have no pending tasks. Create one to get started!
        </p>
      ) : (
        <ul className="task-list">
          {tasks.map((t) => (
            <li key={t.id} className="task-item">
              <Link href={`/tasks/${t.id}`} className="task-title">
                {t.title}
              </Link>
              <div className="task-meta">
                {t.dueDate && (
                  <span className="badge">
                    📅 <NepaliDate date={t.dueDate} />
                  </span>
                )}
                {t.reminderAt && <span className="badge">🔔 reminder set</span>}
              </div>
              <div className="task-actions">
                <button
                  onClick={() => toggleComplete(t)}
                  disabled={loadingId === t.id}
                  className="btn btn-ghost"
                >
                  {t.completed ? 'Undo' : 'Done'}
                </button>
                <button
                  onClick={() => deleteTask(t.id)}
                  disabled={loadingId === t.id}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
