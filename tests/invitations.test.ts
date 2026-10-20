import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { app } from '../server/app.js';
import { Admin } from '../server/models/Admin.js';
import { Invitation } from '../server/models/Invitation.js';
import { EVENT_CATALOG, EVENT_IDS, INVITATION_PRESETS } from '../server/config/events.js';

let mongod: MongoMemoryServer;

const DAY_23_EVENTS = ['shagun', 'dinner-day1', 'mehendi-sangeet'];
const DAY_24_EVENTS = ['breakfast', 'haldi', 'lunch', 'barat'];

// Text that only appears in the 23 November part of the catalog
const DAY_23_MARKERS = ['23 NOVEMBER 2026', 'Shagun', 'Mehendi / Sangeet', 'Monday', '2026-11-23'];
// Text that only appears in the 24 November part of the catalog
const DAY_24_MARKERS = [
  '24 NOVEMBER 2026',
  'Haldi / Bangle Ceremony',
  'Barat',
  'Breakfast',
  'Lunch',
  'MAIN EVENT',
  'Tuesday',
  '2026-11-24',
];

// Keys a public invitation response may contain anywhere in its JSON
const ALLOWED_PUBLIC_KEYS = new Set([
  'success',
  'invitation',
  'schedule',
  'date',
  'isoDate',
  'dayOfWeek',
  'badge',
  'events',
  'id',
  'time',
  'title',
  'sanskrit',
  'subtitle',
  'icon',
  'startsAt',
]);

const collectKeys = (value: unknown, keys = new Set<string>()): Set<string> => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      keys.add(key);
      collectKeys(child, keys);
    });
  }
  return keys;
};

const publicEventIds = (body: any): string[] =>
  body.invitation.schedule.flatMap((day: any) => day.events.map((event: any) => event.id));

describe('Personalized Guest Invitations', () => {
  const adminEmail = 'admin@manyasarthak.wedding';
  const adminPassword = 'InvitationTestPassword2026!';
  let adminCookie = '';
  let adminId = '';

  const createInvitation = (body: Record<string, unknown>) =>
    request(app).post('/api/admin/invitations').set('Cookie', [adminCookie]).send(body);

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.JWT_SECRET = 'invitation_test_jwt_secret_manya_sarthak_2026';
    process.env.NODE_ENV = 'test';

    await mongoose.connect(mongod.getUri(), { dbName: 'bride_wedding_invitation' });
    // Make sure the unique token index exists before the tests run
    await Invitation.init();

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await Admin.create({ email: adminEmail, passwordHash, role: 'admin', isActive: true });
    adminId = admin._id.toString();

    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ email: adminEmail, password: adminPassword });
    const cookies = loginRes.headers['set-cookie'];
    adminCookie = Array.isArray(cookies) ? cookies.join(';') : cookies;
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  // ==========================================================================
  // 1. AUTHENTICATION
  // ==========================================================================
  describe('Admin authentication', () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const protectedRoutes: [string, string][] = [
      ['get', '/api/admin/events'],
      ['get', '/api/admin/invitations'],
      ['post', '/api/admin/invitations'],
      ['get', `/api/admin/invitations/${fakeId}`],
      ['put', `/api/admin/invitations/${fakeId}`],
      ['get', `/api/admin/invitations/${fakeId}/preview`],
      ['post', `/api/admin/invitations/${fakeId}/revoke`],
      ['post', `/api/admin/invitations/${fakeId}/regenerate`],
    ];

    it.each(protectedRoutes)('%s %s without a session → 401', async (method, url) => {
      const res = await (request(app) as any)[method](url).send({ guestName: 'X', allowedEventIds: ['barat'] });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects a forged or expired token', async () => {
      const res = await request(app)
        .get('/api/admin/invitations')
        .set('Cookie', ['admin_token=not-a-real-jwt']);
      expect(res.status).toBe(401);
    });

    it('nothing is created by an unauthenticated request', async () => {
      await request(app)
        .post('/api/admin/invitations')
        .send({ guestName: 'Intruder', allowedEventIds: ['barat'] });
      expect(await Invitation.countDocuments({ guestName: 'Intruder' })).toBe(0);
    });
  });

  // ==========================================================================
  // 2. EVENT CATALOG
  // ==========================================================================
  describe('Server event catalog', () => {
    it('keeps the seven existing event IDs, wording, dates and times', () => {
      expect(EVENT_IDS).toEqual([...DAY_23_EVENTS, ...DAY_24_EVENTS]);
      expect(EVENT_CATALOG.map((day) => day.date)).toEqual(['23 NOVEMBER 2026', '24 NOVEMBER 2026']);
      const haldi = EVENT_CATALOG[1].events.find((event) => event.id === 'haldi');
      expect(haldi?.title).toBe('Haldi / Bangle Ceremony');
      expect(haldi?.time).toBe('10:00 AM');
      const allTitles = EVENT_CATALOG.flatMap((day) => day.events.map((event) => event.title));
      expect(allTitles.some((title) => /reception/i.test(title))).toBe(false);
    });

    it('GET /api/admin/events returns the catalog and presets to an admin', async () => {
      const res = await request(app).get('/api/admin/events').set('Cookie', [adminCookie]);
      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body.days).toHaveLength(2);
      expect(res.body.days.flatMap((d: any) => d.events.map((e: any) => e.id))).toEqual(EVENT_IDS);
      expect(res.body.presets.map((p: any) => p.label)).toEqual([
        'Family',
        'Close Friends',
        'Friends',
        'Colleagues',
      ]);
    });

    it('every preset only references catalog events', () => {
      INVITATION_PRESETS.forEach((preset) => {
        expect(preset.eventIds.length).toBeGreaterThan(0);
        preset.eventIds.forEach((id) => expect(EVENT_IDS).toContain(id));
      });
    });
  });

  // ==========================================================================
  // 3. VALIDATION
  // ==========================================================================
  describe('Invitation validation', () => {
    const invalidBodies: [string, Record<string, unknown>][] = [
      ['missing guest name', { allowedEventIds: ['barat'] }],
      ['whitespace guest name', { guestName: '   ', allowedEventIds: ['barat'] }],
      ['non-string guest name', { guestName: { $ne: '' }, allowedEventIds: ['barat'] }],
      ['oversized guest name', { guestName: 'A'.repeat(101), allowedEventIds: ['barat'] }],
      ['missing events', { guestName: 'Guest' }],
      ['empty event selection', { guestName: 'Guest', allowedEventIds: [] }],
      ['events not an array', { guestName: 'Guest', allowedEventIds: 'barat' }],
      ['unknown event', { guestName: 'Guest', allowedEventIds: ['barat', 'reception'] }],
      ['non-string event', { guestName: 'Guest', allowedEventIds: [{ $gt: '' }] }],
      ['too many events', { guestName: 'Guest', allowedEventIds: Array(50).fill('barat') }],
      ['oversized notes', { guestName: 'Guest', allowedEventIds: ['barat'], notes: 'n'.repeat(501) }],
      ['non-string notes', { guestName: 'Guest', allowedEventIds: ['barat'], notes: 42 }],
    ];

    it.each(invalidBodies)('rejects %s with 400', async (_label, body) => {
      const res = await createInvitation(body);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(typeof res.body.message).toBe('string');
    });

    it('rejects non-JSON mutation requests with 415', async () => {
      const res = await request(app)
        .post('/api/admin/invitations')
        .set('Cookie', [adminCookie])
        .type('form')
        .send('guestName=Form&allowedEventIds=barat');
      expect(res.status).toBe(415);
      expect(await Invitation.countDocuments({ guestName: 'Form' })).toBe(0);
    });

    it('deduplicates events, keeps catalog order and ignores protected fields', async () => {
      const res = await createInvitation({
        guestName: '  Dedupe Guest  ',
        allowedEventIds: ['barat', 'shagun', 'barat', 'haldi', 'shagun'],
        notes: '  Bring sweets  ',
        token: 'attacker-chosen-token-aaaaaaaaaaaa',
        isActive: false,
        viewCount: 999,
        createdBy: '507f1f77bcf86cd799439011',
      });

      expect(res.status).toBe(201);
      expect(res.body.invitation.guestName).toBe('Dedupe Guest');
      expect(res.body.invitation.allowedEventIds).toEqual(['shagun', 'haldi', 'barat']);
      expect(res.body.invitation.notes).toBe('Bring sweets');
      expect(res.body.invitation.token).not.toBe('attacker-chosen-token-aaaaaaaaaaaa');
      expect(res.body.invitation.isActive).toBe(true);
      expect(res.body.invitation.viewCount).toBe(0);

      const stored = await Invitation.findById(res.body.invitation.id);
      expect(stored?.createdBy.toString()).toBe(adminId);
    });
  });

  // ==========================================================================
  // 4. TOKEN GENERATION
  // ==========================================================================
  describe('Token generation', () => {
    it('issues unique, URL-safe 192-bit tokens', async () => {
      const tokens: string[] = [];
      for (let i = 0; i < 15; i++) {
        const res = await createInvitation({ guestName: `Token Guest ${i}`, allowedEventIds: ['lunch'] });
        expect(res.status).toBe(201);
        tokens.push(res.body.invitation.token);
      }
      tokens.forEach((token) => expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/));
      expect(new Set(tokens).size).toBe(tokens.length);
    });

    it('retries with a fresh token if a duplicate token is ever generated', async () => {
      const duplicateError = Object.assign(new Error('E11000 duplicate key'), {
        code: 11000,
        keyPattern: { token: 1 },
      });
      const createSpy = vi.spyOn(Invitation, 'create').mockRejectedValueOnce(duplicateError);

      const res = await createInvitation({ guestName: 'Collision Guest', allowedEventIds: ['lunch'] });

      expect(res.status).toBe(201);
      expect(createSpy).toHaveBeenCalledTimes(2);
      createSpy.mockRestore();
    });

    it('enforces a unique index on token', async () => {
      const indexes = await Invitation.collection.indexes();
      const tokenIndex = indexes.find((index) => index.key.token === 1);
      expect(tokenIndex?.unique).toBe(true);
    });
  });

  // ==========================================================================
  // 5. THREE GUESTS: EVENT FILTERING & GUEST ISOLATION
  // ==========================================================================
  describe('Guest isolation and server-side event filtering', () => {
    const guests = {
      family: { guestName: 'Gandhi Family', allowedEventIds: [...EVENT_IDS], notes: 'SECRET-NOTE-FAMILY' },
      day23: { guestName: 'Day One Friend', allowedEventIds: DAY_23_EVENTS, notes: 'SECRET-NOTE-DAY23' },
      day24: { guestName: 'Office Colleague', allowedEventIds: DAY_24_EVENTS, notes: 'SECRET-NOTE-DAY24' },
    };
    const created: Record<string, any> = {};

    beforeAll(async () => {
      for (const [key, body] of Object.entries(guests)) {
        const res = await createInvitation(body);
        expect(res.status).toBe(201);
        created[key] = res.body.invitation;
      }
    });

    const fetchPublic = (token: string) => request(app).get(`/api/invitations/${token}`);

    it('guest 1 (all events) sees every event across both days', async () => {
      const res = await fetchPublic(created.family.token);
      expect(res.status).toBe(200);
      expect(publicEventIds(res.body)).toEqual(EVENT_IDS);
      expect(res.body.invitation.schedule.map((d: any) => d.date)).toEqual([
        '23 NOVEMBER 2026',
        '24 NOVEMBER 2026',
      ]);
      expect(res.body.invitation.schedule[1].badge).toBe('MAIN EVENT');
    });

    it('guest 2 (23 November only) never receives 24 November data', async () => {
      const res = await fetchPublic(created.day23.token);
      expect(res.status).toBe(200);
      expect(publicEventIds(res.body)).toEqual(DAY_23_EVENTS);
      expect(res.body.invitation.schedule).toHaveLength(1);
      expect(res.body.invitation.schedule[0].date).toBe('23 NOVEMBER 2026');
      expect(res.body.invitation.schedule[0].badge).toBeUndefined();

      const raw = JSON.stringify(res.body);
      DAY_24_MARKERS.forEach((marker) => expect(raw).not.toContain(marker));
      DAY_24_EVENTS.forEach((id) => expect(raw).not.toContain(`"${id}"`));
    });

    it('guest 3 (24 November only) never receives 23 November data', async () => {
      const res = await fetchPublic(created.day24.token);
      expect(res.status).toBe(200);
      expect(publicEventIds(res.body)).toEqual(DAY_24_EVENTS);
      expect(res.body.invitation.schedule).toHaveLength(1);
      expect(res.body.invitation.schedule[0].date).toBe('24 NOVEMBER 2026');

      const raw = JSON.stringify(res.body);
      DAY_23_MARKERS.forEach((marker) => expect(raw).not.toContain(marker));
      DAY_23_EVENTS.forEach((id) => expect(raw).not.toContain(`"${id}"`));
    });

    it('public responses contain only schedule fields, never guest or admin data', async () => {
      for (const key of Object.keys(guests)) {
        const res = await fetchPublic(created[key].token);
        const keys = collectKeys(res.body);
        keys.forEach((k) => expect(ALLOWED_PUBLIC_KEYS.has(k)).toBe(true));

        const raw = JSON.stringify(res.body);
        // No notes, names or tokens of this or any other guest
        Object.values(created).forEach((other: any) => {
          expect(raw).not.toContain(other.notes);
          expect(raw).not.toContain(other.guestName);
          expect(raw).not.toContain(other.token);
          expect(raw).not.toContain(other.id);
        });
        expect(raw).not.toContain(adminId);
      }
    });

    it('public responses send no-store and noindex headers', async () => {
      const ok = await fetchPublic(created.family.token);
      expect(ok.headers['cache-control']).toBe('no-store');
      expect(ok.headers['x-robots-tag']).toBe('noindex, nofollow');

      const missing = await fetchPublic('A'.repeat(32));
      expect(missing.headers['cache-control']).toBe('no-store');
      expect(missing.headers['x-robots-tag']).toBe('noindex, nofollow');
    });

    it('records views for guest visits but not for admin previews', async () => {
      const before = await Invitation.findById(created.day24.id);
      const previewRes = await request(app)
        .get(`/api/admin/invitations/${created.day24.id}/preview`)
        .set('Cookie', [adminCookie]);
      expect(previewRes.status).toBe(200);
      expect(publicEventIds(previewRes.body)).toEqual(DAY_24_EVENTS);
      expect(previewRes.headers['cache-control']).toBe('no-store');

      const afterPreview = await Invitation.findById(created.day24.id);
      expect(afterPreview?.viewCount).toBe(before?.viewCount);

      await fetchPublic(created.day24.token);
      const afterVisit = await Invitation.findById(created.day24.id);
      expect(afterVisit?.viewCount).toBe((before?.viewCount || 0) + 1);
      expect(afterVisit?.lastViewedAt).toBeInstanceOf(Date);
    });

    it('editing an invitation immediately changes what that guest sees', async () => {
      const res = await request(app)
        .put(`/api/admin/invitations/${created.day23.id}`)
        .set('Cookie', [adminCookie])
        .send({ guestName: 'Day One Friend', allowedEventIds: ['mehendi-sangeet'], notes: 'SECRET-NOTE-DAY23' });
      expect(res.status).toBe(200);
      expect(res.body.invitation.allowedEventIds).toEqual(['mehendi-sangeet']);
      expect(res.body.invitation.token).toBe(created.day23.token);

      const publicRes = await fetchPublic(created.day23.token);
      expect(publicEventIds(publicRes.body)).toEqual(['mehendi-sangeet']);

      // Other guests are unaffected
      const other = await fetchPublic(created.day24.token);
      expect(publicEventIds(other.body)).toEqual(DAY_24_EVENTS);
    });

    it('rejects invalid edits and leaves the invitation unchanged', async () => {
      const res = await request(app)
        .put(`/api/admin/invitations/${created.day24.id}`)
        .set('Cookie', [adminCookie])
        .send({ guestName: 'Office Colleague', allowedEventIds: [] });
      expect(res.status).toBe(400);

      const publicRes = await fetchPublic(created.day24.token);
      expect(publicEventIds(publicRes.body)).toEqual(DAY_24_EVENTS);
    });

    it('admin list and detail include tokens and notes for the family only', async () => {
      const list = await request(app).get('/api/admin/invitations').set('Cookie', [adminCookie]);
      expect(list.status).toBe(200);
      expect(list.headers['cache-control']).toBe('no-store');
      const family = list.body.invitations.find((inv: any) => inv.id === created.family.id);
      expect(family.token).toBe(created.family.token);
      expect(family.notes).toBe('SECRET-NOTE-FAMILY');

      // Newest first
      const times = list.body.invitations.map((inv: any) => new Date(inv.createdAt).getTime());
      expect([...times].sort((a, b) => b - a)).toEqual(times);

      const detail = await request(app)
        .get(`/api/admin/invitations/${created.family.id}`)
        .set('Cookie', [adminCookie]);
      expect(detail.status).toBe(200);
      expect(detail.body.invitation.guestName).toBe('Gandhi Family');
    });

    it('unknown or malformed admin invitation IDs return 404', async () => {
      for (const id of ['507f1f77bcf86cd799439099', 'not-an-id', '{"$gt":""}']) {
        const res = await request(app)
          .get(`/api/admin/invitations/${encodeURIComponent(id)}`)
          .set('Cookie', [adminCookie]);
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      }
    });
  });

  // ==========================================================================
  // 6. REVOCATION, REGENERATION & UNIFORM 404s
  // ==========================================================================
  describe('Revocation, regeneration and uniform not-found responses', () => {
    let revoked: any;
    let regenerated: any;
    let oldRegeneratedToken = '';
    let notFoundBody: unknown;

    beforeAll(async () => {
      revoked = (await createInvitation({ guestName: 'Revoked Guest', allowedEventIds: ['barat'] })).body.invitation;
      regenerated = (await createInvitation({ guestName: 'Regenerated Guest', allowedEventIds: ['haldi'] })).body
        .invitation;
      oldRegeneratedToken = regenerated.token;

      const unknown = await request(app).get(`/api/invitations/${'Z'.repeat(32)}`);
      expect(unknown.status).toBe(404);
      notFoundBody = unknown.body;
    });

    it('revoking disables the link immediately', async () => {
      expect((await request(app).get(`/api/invitations/${revoked.token}`)).status).toBe(200);

      const res = await request(app)
        .post(`/api/admin/invitations/${revoked.id}/revoke`)
        .set('Cookie', [adminCookie])
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.invitation.isActive).toBe(false);
      expect(res.body.invitation.revokedAt).toBeTruthy();

      const after = await request(app).get(`/api/invitations/${revoked.token}`);
      expect(after.status).toBe(404);
      expect(after.body).toEqual(notFoundBody);
    });

    it('the family can still preview a revoked invitation', async () => {
      const res = await request(app)
        .get(`/api/admin/invitations/${revoked.id}/preview`)
        .set('Cookie', [adminCookie]);
      expect(res.status).toBe(200);
      expect(publicEventIds(res.body)).toEqual(['barat']);
    });

    it('regenerating invalidates the old link and issues a working new one', async () => {
      const res = await request(app)
        .post(`/api/admin/invitations/${regenerated.id}/regenerate`)
        .set('Cookie', [adminCookie])
        .send({});
      expect(res.status).toBe(200);
      const newToken = res.body.invitation.token;
      expect(newToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
      expect(newToken).not.toBe(oldRegeneratedToken);

      const oldRes = await request(app).get(`/api/invitations/${oldRegeneratedToken}`);
      expect(oldRes.status).toBe(404);
      expect(oldRes.body).toEqual(notFoundBody);

      const newRes = await request(app).get(`/api/invitations/${newToken}`);
      expect(newRes.status).toBe(200);
      expect(publicEventIds(newRes.body)).toEqual(['haldi']);
    });

    it('regenerating a revoked invitation restores it with a new link only', async () => {
      const res = await request(app)
        .post(`/api/admin/invitations/${revoked.id}/regenerate`)
        .set('Cookie', [adminCookie])
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.invitation.isActive).toBe(true);
      expect(res.body.invitation.revokedAt).toBeNull();

      expect((await request(app).get(`/api/invitations/${revoked.token}`)).status).toBe(404);
      expect((await request(app).get(`/api/invitations/${res.body.invitation.token}`)).status).toBe(200);
    });

    it('unknown, malformed, revoked and replaced tokens all get the same 404', async () => {
      const candidates = [
        'Q'.repeat(32), // well-formed but unknown
        'short',
        'x'.repeat(200),
        'has.dots.and~tilde~~~~~~~~~~~~~~',
        '%7B%22%24ne%22%3A%22%22%7D', // {"$ne":""}
        oldRegeneratedToken,
      ];

      for (const token of candidates) {
        const res = await request(app).get(`/api/invitations/${token}`);
        expect(res.status).toBe(404);
        expect(res.body).toEqual(notFoundBody);
      }
      expect(notFoundBody).toEqual({ success: false, message: 'Invitation not found.' });
    });

    it('the API root without a token is not an invitation lookup', async () => {
      const res = await request(app).get('/api/invitations');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('application/json');
    });
  });

  // ==========================================================================
  // 7. DIRECT URL LOADING & PUBLIC BUNDLE (requires `npm run build` first)
  // ==========================================================================
  describe('Direct invitation URLs and built frontend', () => {
    it('GET /invite/:token serves the app shell, never cached or indexed', async () => {
      const res = await request(app).get(`/invite/${'A'.repeat(32)}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('<!doctype html>');
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
    });

    it('GET /admin/invitations/:id/preview serves the app shell', async () => {
      const res = await request(app).get('/admin/invitations/507f1f77bcf86cd799439011/preview');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
    });

    it('the public JavaScript bundle contains no event details', () => {
      const assetsDir = path.resolve(process.cwd(), 'dist', 'assets');
      const bundle = fs
        .readdirSync(assetsDir)
        .filter((file) => file.endsWith('.js'))
        .map((file) => fs.readFileSync(path.join(assetsDir, file), 'utf8'))
        .join('\n');

      const catalogStrings = EVENT_CATALOG.flatMap((day) => [
        day.date,
        day.isoDate,
        ...day.events.flatMap((event) => [event.id, event.title, event.sanskrit, event.subtitle, event.startsAt]),
      ]);
      catalogStrings.forEach((text) => expect(bundle).not.toContain(text));
      expect(bundle).not.toMatch(/november/i);
    });
  });
});
