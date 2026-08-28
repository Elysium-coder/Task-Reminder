import { connectDB } from 'lib/mongodb';
import Task from 'lib/models/Task';
import { requireCron } from 'lib/auth';
import { sendPushToUser } from 'lib/push';
import { sendEmail } from 'lib/email';
import { sendSMS } from 'lib/sms';
import {
  REMINDER_EMAIL_SUBJECT,
  reminderEmailHtml,
  reminderEmailText,
  reminderSmsText,
  reminderPushPayload,
} from 'lib/constants';
import { withErrorHandler, allowMethods, apiError } from 'lib/api';

/**
 * Cron endpoint: deliver due task reminders.
 *
 * Protection: the caller must send the correct `CRON_SECRET` via the
 * `x-cron-secret` header or `?secret=` query param (validated by requireCron).
 *
 * For every task whose `reminderAt` is due, not yet reminded and not completed:
 *   - push notification (if opted in + a subscription exists)
 *   - email         (if opted in + user has an email)
 *   - SMS           (if opted in + user has a phone)
 * Then marks the task `reminded` so it is not sent twice.
 */
export default allowMethods(
  withErrorHandler(async (req, res) => {
    requireCron(req);

    await connectDB();
    const now = new Date();
    const dueTasks = await Task.find({
      reminderAt: { $lte: now },
      reminded: false,
      completed: false,
    })
      .populate('user')
      .lean();

    let delivered = 0;
    const errors = [];

    for (const task of dueTasks) {
      const user = task.user; // populated via .lean() + populate
      const payload = reminderPushPayload(task);

      try {
        // 1) Push
        if (task.notifyPush && user) {
          await sendPushToUser(user._id, payload).catch(() => {});
        }
        // 2) Email
        if (task.notifyEmail && user && user.email) {
          await sendEmail({
            to: user.email,
            subject: REMINDER_EMAIL_SUBJECT,
            text: reminderEmailText(task),
            html: reminderEmailHtml(task),
          }).catch(() => {});
        }
        // 3) SMS
        if (task.notifySms && user && user.phone) {
          await sendSMS({ to: user.phone, message: reminderSmsText(task) }).catch(() => {});
        }
        delivered += 1;
      } catch (e) {
        errors.push({ taskId: task._id.toString(), error: e.message });
      }

      // Mark as reminded regardless (avoid retries spamming); the loop above
      // is best-effort per channel.
      await Task.updateOne({ _id: task._id }, { $set: { reminded: true } });
    }

    return res.status(200).json({ delivered, total: dueTasks.length, errors });
  }),
  ['GET', 'POST']
);
