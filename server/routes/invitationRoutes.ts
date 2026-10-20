import { Router } from 'express';
import { getPublicInvitation } from '../controllers/invitationController.js';
import { invitationLookupLimiter } from '../middleware/rateLimiter.js';
import { privatePage } from '../middleware/httpPolicies.js';

const router = Router();

// GET /api/invitations/:token - Public personalized invitation (allowed events only)
router.get('/:token', privatePage, invitationLookupLimiter, getPublicInvitation);

export default router;
