import { Router } from 'express';
import { QuizSession } from '../storage/QuizSession.js';

const router = Router();

router.post('/', async (req, res) => {
  if (!QuizSession) return res.status(503).json({ error: 'Persistence disabled' });
  try {
    const session = await QuizSession.create(req.body);
    return res.json({ id: session._id.toString() });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  if (!QuizSession) return res.status(503).json({ error: 'Persistence disabled' });
  try {
    const session = await QuizSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    return res.json(session);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
