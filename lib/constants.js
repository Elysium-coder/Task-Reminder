/** Human-readable, reusable message templates for emails / SMS / push. */

export const OTP_EMAIL_SUBJECT = 'Your Task Reminder verification code';
export function otpEmailText(code) {
  return `Your Task Reminder verification code is: ${code}\n\nThis code expires in 10 minutes.`;
}
export function otpEmailHtml(code) {
  return `
<p>Hello,</p>
<p>Your one-time verification code is:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
<p>This code expires in 10 minutes. Do not share it with anyone.</p>
`;
}
export const otpSmsText = (code) => `Your Task Reminder OTP is ${code}. It expires in 10 minutes.`;

export const REMINDER_EMAIL_SUBJECT = 'Task Reminder — due soon';
export function reminderEmailText(task) {
  const due = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'no due date';
  return `Reminder: ${task.title}\n\n${task.description || ''}\n\nDue: ${due}`;
}
export function reminderEmailHtml(task) {
  const due = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'no due date';
  return `
<p>Reminder: <strong>${task.title}</strong></p>
<p>${task.description || ''}</p>
<p><em>Due: ${due}</em></p>
`;
}
export const reminderSmsText = (task) => `Reminder: "${task.title}"`;

export function reminderPushPayload(task) {
  const id = String(task._id);
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;
  return {
    title: `🔔 ${task.title}`,
    options: {
      body: task.description || 'Your task is due!',
      url: `/tasks/${id}`,
      tag: `task-${id}`,
      data: { taskId: id, due },
    },
  };
}
