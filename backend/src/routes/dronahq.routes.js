import express from 'express';
import { callProspectHandler, postWebhookHandler, preWebhookHandler } from '../controllers/dronahq.controller.js';

const router = express.Router();

router.post('/voice/pre-webhook', preWebhookHandler);
router.post('/voice/post-webhook', postWebhookHandler);
router.post('/call', callProspectHandler);

export default router;
