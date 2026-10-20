import { Router } from 'express';
import { adminLogin, adminLogout, adminGetMe } from '../controllers/adminController.js';
import { getAdminWishes } from '../controllers/wishController.js';
import {
  getAdminEvents,
  listInvitations,
  createInvitation,
  getInvitation,
  updateInvitation,
  previewInvitation,
  revokeInvitation,
  regenerateInvitation,
} from '../controllers/invitationController.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { noStore, requireJsonContent } from '../middleware/httpPolicies.js';

const router = Router();

// POST /api/admin/login - Authenticate admin & issue HttpOnly JWT cookie
router.post('/login', loginLimiter, adminLogin);

// POST /api/admin/logout - Clear HttpOnly auth cookie
router.post('/logout', adminLogout);

// GET /api/admin/me - Verify active admin session
router.get('/me', requireAdmin, adminGetMe);

// GET /api/admin/wishes - Fetch all submitted wishes (authenticated)
router.get('/wishes', requireAdmin, getAdminWishes);

// GET /api/admin/events - Full event catalog and invitation presets (authenticated)
router.get('/events', noStore, requireAdmin, getAdminEvents);

// GET /api/admin/invitations - List all guest invitations (authenticated)
router.get('/invitations', noStore, requireAdmin, listInvitations);

// POST /api/admin/invitations - Create a guest invitation (authenticated)
router.post('/invitations', noStore, requireAdmin, requireJsonContent, createInvitation);

// GET /api/admin/invitations/:id - View a single invitation (authenticated)
router.get('/invitations/:id', noStore, requireAdmin, getInvitation);

// PUT /api/admin/invitations/:id - Edit a guest invitation (authenticated)
router.put('/invitations/:id', noStore, requireAdmin, requireJsonContent, updateInvitation);

// GET /api/admin/invitations/:id/preview - Guest view of an invitation (authenticated)
router.get('/invitations/:id/preview', noStore, requireAdmin, previewInvitation);

// POST /api/admin/invitations/:id/revoke - Disable an invitation link (authenticated)
router.post(
  '/invitations/:id/revoke',
  noStore,
  requireAdmin,
  requireJsonContent,
  revokeInvitation
);

// POST /api/admin/invitations/:id/regenerate - Replace the invitation link (authenticated)
router.post(
  '/invitations/:id/regenerate',
  noStore,
  requireAdmin,
  requireJsonContent,
  regenerateInvitation
);

export default router;
