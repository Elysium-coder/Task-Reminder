import { useState } from 'react';
import { useRouter } from 'next/router';
import { getServerSideUser, loginRedirect } from 'lib/ssr';
import { connectDB } from 'lib/mongodb';
import Task from 'lib/models/Task';
import TaskForm from 'components/TaskForm';

function sanitizeTask(t) {
  return {
    id: t._id.toString(),
    title: t.title,
    description: t.description,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    reminderAt: t.reminderAt ? new Date(t.reminderAt).toISOString() : null,
    notifyEmail: t.notifyEmail,
    notifyPush: t.notifyPush,
    notifySms: t.notifySms,
    completed: t.completed,
  };
}

export async function getServerSideProps(context) {
  const user = await getServerSideUser(context);
  if (!user) return loginRedirect(context.resolvedUrl);

  await connectDB();
  const task = await Task.findOne({ _id: context.params.id, user: user.id }).lean();
  if (!task) return { notFound: true };

  return { props: { initialUser: user, initialTask: sanitizeTask(task) } };
}

export default function TaskPage({ initialTask }) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');
      setTask({ ...task, ...data.task });
      alert('Task saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/tasks');
    else alert('Could not delete task');
  };

  return (
    <section className="page">
      <h1>Edit task</h1>
      {error && <p className="error">{error}</p>}
      <TaskForm
        initial={task}
        onSubmit={handleSubmit}
        loading={submitting}
        submitLabel="Save changes"
      />
      <button onClick={handleDelete} className="btn btn-danger">
        Delete task
      </button>
    </section>
  );
}
