import mongoose, { Document, Schema, Types } from 'mongoose';
import { isKnownEventId } from '../config/events.js';

export interface IInvitation extends Document {
  guestName: string;
  allowedEventIds: string[];
  token: string;
  isActive: boolean;
  revokedAt: Date | null;
  notes: string;
  createdBy: Types.ObjectId;
  viewCount: number;
  lastViewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
      maxlength: [100, 'Guest name cannot exceed 100 characters'],
      validate: {
        validator: (v: string) => v.trim().length > 0,
        message: 'Guest name cannot be only whitespace',
      },
    },
    allowedEventIds: {
      type: [String],
      required: [true, 'At least one event must be selected'],
      validate: [
        {
          validator: (v: string[]) => Array.isArray(v) && v.length > 0,
          message: 'At least one event must be selected',
        },
        {
          validator: (v: string[]) => v.every((id) => isKnownEventId(id)),
          message: 'Invitation contains an unknown event',
        },
        {
          validator: (v: string[]) => new Set(v).size === v.length,
          message: 'Invitation contains duplicate events',
        },
      ],
    },
    token: {
      type: String,
      required: [true, 'Invitation token is required'],
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Creating admin is required'],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastViewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'invitations',
  }
);

// Index to list invitations newest first in the admin dashboard
invitationSchema.index({ createdAt: -1 });

export const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema);
