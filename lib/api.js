/**
 * Small helpers for API route handlers (error wrapping + method guarding).
 */

export function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      if (res.headersSent) return;
      const status = typeof e.status === 'number' ? e.status : 500;
      console.error(`[api] ${req.method} ${req.url} -> ${status}`, {
        message: e?.message,
        code: e?.code,
        stack: e?.stack,
        cause: e?.cause?.message || e?.cause,
      });
      // Never leak internal error details (stack traces, driver messages) to
      // the client for 5xx; return a generic message but keep the details in logs.
      const safeMessage =
        status >= 500 ? 'Internal Server Error. Please try again later.' : e.message;
      res.status(status).json({ error: safeMessage || 'Internal Server Error' });
    }
  };
}

export function allowMethods(handler, methods) {
  return async (req, res) => {
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(', '));
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    return handler(req, res);
  };
}

export function apiError(message, status) {
  const err = new Error(message);
  err.status = typeof status === 'number' ? status : 500;
  return err;
}
