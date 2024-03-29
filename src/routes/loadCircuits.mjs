import express from 'express';
import loadCircuits from '../services/loadCircuits.mjs';

const router = express.Router();

router.post('/', async (req, res, next) => {
  req.setTimeout(900000);

  if (!req.files) {
    return res.send({
      status: false,
      message: 'No file uploaded',
    });
  }

  try {
    res.send(await loadCircuits(req.files.circuits));
  } catch (err) {
    next(err);
  }
});

export default router;
