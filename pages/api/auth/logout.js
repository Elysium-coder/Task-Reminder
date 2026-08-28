import { clearAuthToken } from 'lib/auth';
import { withErrorHandler, allowMethods } from 'lib/api';

export default allowMethods(
  withErrorHandler(async (req, res) => {
    clearAuthToken(res);
    return res.status(200).json({ ok: true });
  }),
  ['POST', 'GET']
);
