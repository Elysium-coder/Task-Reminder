import { useState } from 'react';

/** Convert an ISO/Date string into a `datetime-local` input value. */
export function toDateTimeLocal(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  // Use local time fields for the input (displayed & parsed in local TZ).
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TaskForm({ initial = {}, onSubmit, loading, submitLabel = 'Save task' }) {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [dueDate, setDueDate] = useState(toDateTimeLocal(initial.dueDate));
  const [reminderAt, setReminderAt] = useState(toDateTimeLocal(initial.reminderAt));
  const [notifyEmail, setNotifyEmail] = useState(initial.notifyEmail !== false);
  const [notifyPush, setNotifyPush] = useState(initial.notifyPush !== false);
  const [notifySms, setNotifySms] = useState(!!initial.notifySms);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      ...(initial.id ? { id: initial.id } : {}),
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
      notifyEmail,
      notifyPush,
      notifySms,
    });
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="input"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="textarea"
      />
      <div className="row">
        <label>
          <span>Due date</span>
          <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label>
          <span>Remind me at</span>
          <input type="datetime-local" value={reminderAt} onChange={(e) => setReminderAt(e.target.value)} />
        </label>
      </div>
      <fieldset className="checkboxes">
        <label>
          <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
          Email reminder
        </label>
        <label>
          <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
          Push reminder
        </label>
        <label>
          <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} />
          SMS reminder
        </label>
      </fieldset>
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
