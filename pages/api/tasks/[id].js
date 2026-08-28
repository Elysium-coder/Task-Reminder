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
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw apiError('Task not found.', 404);
    }

    if (req.method === 'GET') {
      const task = await Task.findOne({ _id: id, user: session.userId }).lean();
      if (!task) throw apiError('Task not found.', 404);
      return res.status(200).json({ task: sanitizeTask(task) });
    }

    if (req.method === 'PUT') {
      const existing = await Task.findOne({ _id: id, user: session.userId });
      if (!existing) throw apiError('Task not found.', 404);

      const {
        title,
        description,
        dueDate,
        reminderAt,
        notifyEmail,
        notifyPush,
        notifySms,
        completed,
      } = req.body || {};

      if (title !== undefined) {
        if (!sanitizeString(title)) throw apiError('Title is required.', 400);
        existing.title = sanitizeString(title, 200);
      }
      if (description !== undefined) {
        existing.description = sanitizeString(description || '', 5000);
      }
      if (dueDate !== undefined) {
        existing.dueDate = dueDate ? new Date(dueDate) : null;
      }
      if (reminderAt !== undefined) {
        existing.reminderAt = reminderAt ? new Date(reminderAt) : null;
      }
      if (notifyEmail !== undefined) existing.notifyEmail = notifyEmail !== false;
      if (notifyPush !== undefined) existing.notifyPush = notifyPush !== false;
      if (notifySms !== undefined) existing.notifySms = !!notifySms;
      if (completed !== undefined) {
        existing.completed = completed === true || completed === 'true';
      }

      await existing.save();
      const updated = await Task.findById(existing._id).lean();
      return res.status(200).json({ task: sanitizeTask(updated) });
    }

    // DELETE
    const result = await Task.deleteOne({ _id: id, user: session.userId });
    if (result.deletedCount === 0) throw apiError('Task not found.', 404);
    return res.status(200).json({ ok: true });
  }),
  ['GET', 'PUT', 'DELETE']
);
