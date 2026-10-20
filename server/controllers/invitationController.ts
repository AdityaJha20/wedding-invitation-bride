import { Request, Response } from 'express';
import { Invitation, IInvitation } from '../models/Invitation.js';
import {
  EVENT_CATALOG,
  EVENT_IDS,
  INVITATION_PRESETS,
  buildScheduleForEvents,
  isKnownEventId,
  normalizeEventIds,
} from '../config/events.js';
import { generateInviteToken, isWellFormedInviteToken } from '../utils/inviteToken.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const MAX_GUEST_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;
const MAX_TOKEN_ATTEMPTS = 3;
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

// One uniform response for every token that cannot be served (unknown,
// malformed, revoked or replaced), so callers cannot tell the cases apart.
const PUBLIC_NOT_FOUND = {
  success: false,
  message: 'Invitation not found.',
} as const;

const ADMIN_NOT_FOUND = {
  success: false,
  message: 'Invitation not found.',
} as const;

interface InvitationInput {
  guestName: string;
  allowedEventIds: string[];
  notes?: string;
}

type ValidationResult =
  | { ok: true; value: InvitationInput }
  | { ok: false; message: string };

const validateInvitationInput = (body: unknown): ValidationResult => {
  const { guestName, allowedEventIds, notes } = (body || {}) as Record<string, unknown>;

  if (typeof guestName !== 'string' || !guestName.trim()) {
    return { ok: false, message: "Please enter the guest's name." };
  }

  const trimmedName = guestName.trim();
  if (trimmedName.length > MAX_GUEST_NAME_LENGTH) {
    return {
      ok: false,
      message: `Guest name must be ${MAX_GUEST_NAME_LENGTH} characters or fewer.`,
    };
  }

  if (!Array.isArray(allowedEventIds) || allowedEventIds.length === 0) {
    return { ok: false, message: 'Please select at least one event.' };
  }

  // Bound the work done on hostile input before validating each entry
  if (allowedEventIds.length > EVENT_IDS.length * 2) {
    return { ok: false, message: 'Too many events selected.' };
  }

  if (!allowedEventIds.every((id) => isKnownEventId(id))) {
    return { ok: false, message: 'One or more selected events are not valid.' };
  }

  const value: InvitationInput = {
    guestName: trimmedName,
    allowedEventIds: normalizeEventIds(allowedEventIds as string[]),
  };

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      return { ok: false, message: 'Notes must be text.' };
    }
    const trimmedNotes = notes.trim();
    if (trimmedNotes.length > MAX_NOTES_LENGTH) {
      return {
        ok: false,
        message: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`,
      };
    }
    value.notes = trimmedNotes;
  } else if (notes === null) {
    value.notes = '';
  }

  return { ok: true, value };
};

const isDuplicateTokenError = (error: unknown): boolean => {
  const err = error as { code?: number; keyPattern?: Record<string, unknown> };
  return err?.code === 11000 && Boolean(err.keyPattern?.token);
};

const toAdminInvitation = (doc: IInvitation) => ({
  id: doc._id.toString(),
  guestName: doc.guestName,
  allowedEventIds: [...doc.allowedEventIds],
  token: doc.token,
  isActive: doc.isActive,
  revokedAt: doc.revokedAt,
  notes: doc.notes || '',
  viewCount: doc.viewCount || 0,
  lastViewedAt: doc.lastViewedAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const findInvitationById = async (id: unknown): Promise<IInvitation | null> => {
  if (typeof id !== 'string' || !OBJECT_ID_PATTERN.test(id)) {
    return null;
  }
  return Invitation.findById(id);
};

// GET /api/admin/events - Full catalog and presets for the admin form
export const getAdminEvents = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    days: EVENT_CATALOG,
    presets: INVITATION_PRESETS,
  });
};

// GET /api/admin/invitations - All invitations, newest first
export const listInvitations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const invitations = await Invitation.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      invitations: invitations.map(toAdminInvitation),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invitations.',
    });
  }
};

// POST /api/admin/invitations - Create an invitation with a fresh token
export const createInvitation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const result = validateInvitationInput(req.body);
  if (!result.ok) {
    res.status(400).json({ success: false, message: result.message });
    return;
  }

  try {
    for (let attempt = 1; attempt <= MAX_TOKEN_ATTEMPTS; attempt++) {
      try {
        const invitation = await Invitation.create({
          guestName: result.value.guestName,
          allowedEventIds: result.value.allowedEventIds,
          notes: result.value.notes ?? '',
          token: generateInviteToken(),
          createdBy: req.admin?.id,
        });

        res.status(201).json({
          success: true,
          message: 'Invitation created.',
          invitation: toAdminInvitation(invitation),
        });
        return;
      } catch (error) {
        if (isDuplicateTokenError(error) && attempt < MAX_TOKEN_ATTEMPTS) {
          continue;
        }
        throw error;
      }
    }
  } catch {
    res.status(500).json({
      success: false,
      message: 'Unable to create the invitation.',
    });
  }
};

// GET /api/admin/invitations/:id - A single invitation
export const getInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const invitation = await findInvitationById(req.params.id);
    if (!invitation) {
      res.status(404).json(ADMIN_NOT_FOUND);
      return;
    }

    res.status(200).json({
      success: true,
      invitation: toAdminInvitation(invitation),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve the invitation.',
    });
  }
};

// PUT /api/admin/invitations/:id - Edit guest name, events and notes
export const updateInvitation = async (req: Request, res: Response): Promise<void> => {
  const result = validateInvitationInput(req.body);
  if (!result.ok) {
    res.status(400).json({ success: false, message: result.message });
    return;
  }

  try {
    const invitation = await findInvitationById(req.params.id);
    if (!invitation) {
      res.status(404).json(ADMIN_NOT_FOUND);
      return;
    }

    invitation.guestName = result.value.guestName;
    invitation.allowedEventIds = result.value.allowedEventIds;
    if (result.value.notes !== undefined) {
      invitation.notes = result.value.notes;
    }
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation updated.',
      invitation: toAdminInvitation(invitation),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Unable to update the invitation.',
    });
  }
};

// GET /api/admin/invitations/:id/preview - Guest view without counting a visit.
// Works for revoked invitations so the family can still review them.
export const previewInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const invitation = await findInvitationById(req.params.id);
    if (!invitation) {
      res.status(404).json(ADMIN_NOT_FOUND);
      return;
    }

    res.status(200).json({
      success: true,
      invitation: {
        schedule: buildScheduleForEvents(invitation.allowedEventIds),
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Unable to preview the invitation.',
    });
  }
};

// POST /api/admin/invitations/:id/revoke - Disable the link immediately
export const revokeInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const invitation = await findInvitationById(req.params.id);
    if (!invitation) {
      res.status(404).json(ADMIN_NOT_FOUND);
      return;
    }

    if (invitation.isActive) {
      invitation.isActive = false;
      invitation.revokedAt = new Date();
      await invitation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Invitation revoked.',
      invitation: toAdminInvitation(invitation),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Unable to revoke the invitation.',
    });
  }
};

// POST /api/admin/invitations/:id/regenerate - Issue a new link. The old token
// stops working at once; a revoked invitation becomes active with the new link.
export const regenerateInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const invitation = await findInvitationById(req.params.id);
    if (!invitation) {
      res.status(404).json(ADMIN_NOT_FOUND);
      return;
    }

    for (let attempt = 1; attempt <= MAX_TOKEN_ATTEMPTS; attempt++) {
      invitation.token = generateInviteToken();
      invitation.isActive = true;
      invitation.revokedAt = null;
      try {
        await invitation.save();
        break;
      } catch (error) {
        if (isDuplicateTokenError(error) && attempt < MAX_TOKEN_ATTEMPTS) {
          continue;
        }
        throw error;
      }
    }

    res.status(200).json({
      success: true,
      message: 'A new invitation link has been generated.',
      invitation: toAdminInvitation(invitation),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Unable to generate a new link.',
    });
  }
};

// GET /api/invitations/:token - Public guest invitation.
// Returns only the schedule filtered to this guest's events; never the guest
// record, notes, token, other guests or the full catalog.
export const getPublicInvitation = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  if (!isWellFormedInviteToken(token)) {
    res.status(404).json(PUBLIC_NOT_FOUND);
    return;
  }

  try {
    const invitation = await Invitation.findOneAndUpdate(
      { token, isActive: true },
      { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } },
      {
        projection: { allowedEventIds: 1 },
        returnDocument: 'after',
        timestamps: false,
      }
    ).lean();

    if (!invitation) {
      res.status(404).json(PUBLIC_NOT_FOUND);
      return;
    }

    res.status(200).json({
      success: true,
      invitation: {
        schedule: buildScheduleForEvents(invitation.allowedEventIds || []),
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Unable to load this invitation right now.',
    });
  }
};
