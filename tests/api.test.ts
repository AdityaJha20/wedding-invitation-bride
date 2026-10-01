import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/app.js';
import { GuestWish } from '../server/models/GuestWish.js';
import { Admin } from '../server/models/Admin.js';
import { signAdminToken } from '../server/utils/jwt.js';

describe('Wedding Invitation API Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // 1. GUEST WISHES FLOWS
  // ============================================================================
  describe('Guest Wishes API (POST /api/wishes)', () => {
    it('valid submission → saved successfully', async () => {
      const mockWish = {
        name: 'Rahul Sharma',
        wishes: 'Wishing you both a lifetime of eternal love and joyful laughter!',
        createdAt: new Date(),
      };

      vi.spyOn(GuestWish, 'create').mockResolvedValueOnce(mockWish as any);

      const res = await request(app)
        .post('/api/wishes')
        .send({
          name: 'Rahul Sharma',
          wishes: 'Wishing you both a lifetime of eternal love and joyful laughter!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Your wishes have been saved.');
      expect(GuestWish.create).toHaveBeenCalledWith({
        name: 'Rahul Sharma',
        wishes: 'Wishing you both a lifetime of eternal love and joyful laughter!',
      });
    });

    it('empty name → rejected with 400', async () => {
      const res = await request(app)
        .post('/api/wishes')
        .send({
          name: '   ',
          wishes: 'Congratulations!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please share both your name and your blessing.');
    });

    it('empty wishes → rejected with 400', async () => {
      const res = await request(app)
        .post('/api/wishes')
        .send({
          name: 'Ananya',
          wishes: '     ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please share both your name and your blessing.');
    });

    it('missing fields → rejected with 400', async () => {
      const res = await request(app)
        .post('/api/wishes')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Please provide both your name and your blessings');
    });

    it('oversized name input → rejected with 400', async () => {
      const longName = 'A'.repeat(105);
      const res = await request(app)
        .post('/api/wishes')
        .send({
          name: longName,
          wishes: 'Best wishes!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Name must be 100 characters or fewer');
    });

    it('oversized wishes input → rejected with 400', async () => {
      const longWishes = 'Blessings '.repeat(300); // 3000 chars > 2000
      const res = await request(app)
        .post('/api/wishes')
        .send({
          name: 'Pooja',
          wishes: longWishes,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Wishes must be 2000 characters or fewer');
    });
  });

  // ============================================================================
  // 2. ADMIN AUTHENTICATION & DASHBOARD FLOWS
  // ============================================================================
  describe('Admin Auth & Dashboard API', () => {
    const mockAdminId = '507f1f77bcf86cd799439011';
    const mockAdmin = {
      _id: mockAdminId,
      email: 'admin@manyasarthak.wedding',
      passwordHash: 'hashed_password_val',
      role: 'admin',
      isActive: true,
      comparePassword: vi.fn(),
    };

    it('valid login → authenticated & HttpOnly cookie issued', async () => {
      mockAdmin.comparePassword.mockResolvedValueOnce(true);
      vi.spyOn(Admin, 'findOne').mockResolvedValueOnce(mockAdmin as any);

      const res = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@manyasarthak.wedding',
          password: 'CorrectAdminPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome back, Administrator.');
      expect(res.body.admin.email).toBe('admin@manyasarthak.wedding');

      // Verify Set-Cookie header contains HttpOnly admin_token
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain('admin_token=');
      expect(cookieStr.toLowerCase()).toContain('httponly');
    });

    it('wrong password → rejected with 401', async () => {
      mockAdmin.comparePassword.mockResolvedValueOnce(false);
      vi.spyOn(Admin, 'findOne').mockResolvedValueOnce(mockAdmin as any);

      const res = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@manyasarthak.wedding',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('non-existent email → rejected with 401', async () => {
      vi.spyOn(Admin, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('unauthenticated dashboard request (GET /api/admin/wishes) → rejected with 401', async () => {
      const res = await request(app).get('/api/admin/wishes');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Authentication required. Please log in.');
    });

    it('authenticated dashboard request → wishes returned ordered newest first', async () => {
      const token = signAdminToken({
        id: mockAdminId,
        email: mockAdmin.email,
        role: 'admin',
      });

      vi.spyOn(Admin, 'findById').mockResolvedValueOnce(mockAdmin as any);

      const mockWishesList = [
        {
          _id: '1',
          name: 'Pooja & Rohan',
          wishes: 'May your bond blossom with every passing year!',
          createdAt: new Date('2026-09-25T10:00:00Z'),
        },
        {
          _id: '2',
          name: 'Amit Kumar',
          wishes: 'Heartiest congratulations to Manya and Sarthak!',
          createdAt: new Date('2026-09-24T18:30:00Z'),
        },
      ];

      const findQueryMock = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValueOnce(mockWishesList),
      };
      vi.spyOn(GuestWish, 'find').mockReturnValueOnce(findQueryMock as any);

      const res = await request(app)
        .get('/api/admin/wishes')
        .set('Cookie', [`admin_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.wishes).toHaveLength(2);
      expect(res.body.wishes[0].name).toBe('Pooja & Rohan');
      expect(findQueryMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('logout (POST /api/admin/logout) → session cookie cleared', async () => {
      const res = await request(app).post('/api/admin/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully.');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      // Cleared cookie either has empty value or max-age=0 / expires in past
      expect(cookieStr).toMatch(/admin_token=;|(admin_token=.*Expires=Thu, 01 Jan 1970)|Max-Age=0/i);
    });

    it('session verification (GET /api/admin/me) → returns current admin details', async () => {
      const token = signAdminToken({
        id: mockAdminId,
        email: mockAdmin.email,
        role: 'admin',
      });

      vi.spyOn(Admin, 'findById').mockResolvedValueOnce(mockAdmin as any);

      const res = await request(app)
        .get('/api/admin/me')
        .set('Cookie', [`admin_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.admin.email).toBe(mockAdmin.email);
      expect(res.body.admin.role).toBe('admin');
    });
  });

  // ============================================================================
  // 3. HEALTH CHECK & SECURITY HEADERS
  // ============================================================================
  describe('System Health & Security', () => {
    it('GET /api/health → reports status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /api/unknown-endpoint → returns 404 with standard JSON (not swallowed by SPA)', async () => {
      const res = await request(app).get('/api/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('API route not found.');
      expect(res.headers['content-type']).toContain('application/json');
    });

    it('SPA Fallback: GET / returns HTML index', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('<!doctype html>');
    });

    it('SPA Fallback: GET /admin/login returns HTML index', async () => {
      const res = await request(app).get('/admin/login');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('<!doctype html>');
    });

    it('SPA Fallback: GET /admin returns HTML index', async () => {
      const res = await request(app).get('/admin');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('<!doctype html>');
    });
  });
});

