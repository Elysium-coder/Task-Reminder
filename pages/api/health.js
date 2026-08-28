import { withErrorHandler, allowMethods } from 'lib/api';

export default allowMethods(
  withErrorHandler(async (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  }),
  ['GET']
);
