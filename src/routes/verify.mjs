import express from 'express';

import logger from '../utils/logger.mjs';
import verify from '../services/verify.mjs';

const router = express.Router();
/**

*/
router.post('/', async (req, res, next) => {
  try {
    logger.info(`Received request to /verify`);
    logger.debug('Body', req.body);

    const verifies = await verify(req.body);
    logger.debug(`verify returned ${verifies}`);
    return res.send({ verifies });
  } catch (err) {
    return next(err);
  }
});

export default router;
