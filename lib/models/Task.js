import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    dueDate: { type: Date, default: null },
    // When a reminder should be delivered (before the due date).
    reminderAt: { type: Date, default: null, index: true },
    // Notification delivery flags.
    notifyEmail: { type: Boolean, default: true },
    notifyPush: { type: Boolean, default: true },
    notifySms: { type: Boolean, default: false },
    // Whether the reminder has already been sent.
    reminded: { type: Boolean, default: false },
    completed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
