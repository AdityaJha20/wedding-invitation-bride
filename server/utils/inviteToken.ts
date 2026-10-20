import crypto from 'crypto';

// 24 random bytes = 192 bits of entropy, encoded as 32 URL-safe characters
const TOKEN_BYTES = 24;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export const generateInviteToken = (): string => {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
};

export const isWellFormedInviteToken = (value: unknown): value is string => {
  return typeof value === 'string' && TOKEN_PATTERN.test(value);
};
