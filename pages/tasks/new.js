import { useState } from 'react';
import { useRouter } from 'next/router';
import { getServerSideUser, loginRedirect } from 'lib/ssr';
import TaskForm from 'components/TaskForm';

export async function getServerSideProps(context) {
  const user = await getServerSideUser(context);
  if (!user) return loginRedirect(context.resolvedUrl);
  return { props: { initialUser: user } };
}

export default function NewTaskPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');
      router.push(`/tasks/${data.task.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page">
      <h1>New task</h1>
      {error && <p className="error">{error}</p>}
      <TaskForm onSubmit={handleSubmit} loading={submitting} submitLabel="Create task" />
    </section>
  );
}
