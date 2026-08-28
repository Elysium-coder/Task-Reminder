import { connectDB } from 'lib/mongodb';
import Task from 'lib/models/Task';
import { requireAuth } from 'lib/auth';
import { withErrorHandler, allowMethods, apiError } from 'lib/api';
import { sanitizeString } from 'lib/validation';
import mongoose from 'mongoose';

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
    reminded: t.reminded,
    completed: t.completed,
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
  };
}

export default allowMethods(
  withErrorHandler(async (req, res) => {
    await connectDB();
    const session = requireAuth(req);

    if (req.method === 'GET') {
      const { completed } = req.query;
      let query = { user: session.userId };
      // By default only show pending tasks. Pass ?completed=true to see finished.
      if (completed !== undefined) {
        query.completed = completed === 'true' || completed === true;
      } else {
        query.completed = false;
      }
      const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ tasks: tasks.map(sanitizeTask) });
    }

    // POST — create
    const { title, description, dueDate, reminderAt, notifyEmail, notifyPush, notifySms } =
      req.body || {};
    if (!sanitizeString(title)) throw apiError('Title is required.', 400);

    const task = await Task.create({
      user: session.userId,
      title: sanitizeString(title, 200),
      description: sanitizeString(description || '', 5000),
      dueDate: dueDate ? new Date(dueDate) : null,
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      notifyEmail: notifyEmail !== false,
      notifyPush: notifyPush !== false,
      notifySms: !!notifySms,
    });
    return res.status(201).json({ task: sanitizeTask(task) });
  }),
  ['GET', 'POST']
);
