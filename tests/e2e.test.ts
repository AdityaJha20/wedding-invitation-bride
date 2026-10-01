import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import { app } from '../server/app.js';
import { GuestWish } from '../server/models/GuestWish.js';
import { Admin } from '../server/models/Admin.js';

let mongod: MongoMemoryServer;

describe('Full End-to-End MongoDB Architecture & Flow Verification', () => {
  const adminEmail = 'admin@manyasarthak.wedding';
  const adminPassword = 'SuperSecretWeddingPassword2026!';
  let adminAuthCookie: string = '';

  beforeAll(async () => {
    // Spin up actual MongoDB instance
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'e2e_jwt_secret_manya_sarthak_2026';
    process.env.NODE_ENV = 'test';

    // Connect Mongoose to the live database
    await mongoose.connect(uri, {
      dbName: 'bride_wedding_invitation',
    });

    // Seed test Admin account with bcrypt hash
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await Admin.create({
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isActive: true,
    });
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  // 1. Verify Database Connectivity & Collection Schemas
  it('1. MongoDB Connectivity: connects to database bride_wedding_invitation and creates collections', async () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    expect(mongoose.connection.name).toBe('bride_wedding_invitation');

    const admin = await Admin.findOne({ email: adminEmail });
    expect(admin).not.toBeNull();
    expect(admin?.email).toBe(adminEmail);
    expect(admin?.role).toBe('admin');
    expect(admin?.passwordHash).not.toBe(adminPassword); // Never plaintext
  });

  // 2. Guest Wish Submission (Valid)
  it('2. Guest Submission: POST /api/wishes saves a valid wish to MongoDB', async () => {
    const res = await request(app)
      .post('/api/wishes')
      .send({
        name: 'Aarav Mehta',
        wishes: 'Wishing Manya and Sarthak a blissful married life filled with endless joy!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Your wishes have been saved.');

    // 3. Verify Record appears in MongoDB
    const savedRecord = await GuestWish.findOne({ name: 'Aarav Mehta' });
    expect(savedRecord).not.toBeNull();
    expect(savedRecord?.name).toBe('Aarav Mehta');
    expect(savedRecord?.wishes).toContain('blissful married life');
    expect(savedRecord?.createdAt).toBeDefined();
    expect(savedRecord?.updatedAt).toBeDefined();
  });

  // 4. Guest Wish Validation & Protection
  it('3. Guest Validation: rejects empty/whitespace-only input', async () => {
    const emptyNameRes = await request(app)
      .post('/api/wishes')
      .send({
        name: '   ',
        wishes: 'Congratulations!',
      });
    expect(emptyNameRes.status).toBe(400);
    expect(emptyNameRes.body.success).toBe(false);

    const emptyWishRes = await request(app)
      .post('/api/wishes')
      .send({
        name: 'Priya',
        wishes: '   \n  \t  ',
      });
    expect(emptyWishRes.status).toBe(400);
    expect(emptyWishRes.body.success).toBe(false);
  });

  it('4. Guest Validation: rejects oversized inputs', async () => {
    const oversizedName = 'X'.repeat(101);
    const res = await request(app)
      .post('/api/wishes')
      .send({
        name: oversizedName,
        wishes: 'Congratulations!',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 5. Admin Login - Failure Cases
  it('5. Admin Login: rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: adminEmail,
        password: 'IncorrectPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  it('6. Admin Login: rejects nonexistent email', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'intruder@unknown.com',
        password: 'SomePassword123',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 6. Admin Login - Success Case & Cookie Issuance
  it('7. Admin Login: valid login issues HttpOnly JWT cookie', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: adminEmail,
        password: adminPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.admin.email).toBe(adminEmail);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieStr).toContain('admin_token=');
    expect(cookieStr.toLowerCase()).toContain('httponly');

    // Save cookie for subsequent requests
    adminAuthCookie = cookieStr;
  });

  // 7. Protected Admin Wishes Dashboard
  it('8. Admin Dashboard: unauthenticated request to /api/admin/wishes is rejected', async () => {
    const res = await request(app).get('/api/admin/wishes');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('9. Admin Dashboard: authenticated request returns submitted wishes from MongoDB', async () => {
    // Add another wish to verify chronological ordering
    await GuestWish.create({
      name: 'Diya & Vikram',
      wishes: 'Heartiest congratulations to the lovely couple!',
    });

    const res = await request(app)
      .get('/api/admin/wishes')
      .set('Cookie', [adminAuthCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(2);
    expect(res.body.wishes).toBeInstanceOf(Array);

    // Newest submissions first
    const [firstWish, secondWish] = res.body.wishes;
    expect(firstWish.name).toBe('Diya & Vikram');
    expect(secondWish.name).toBe('Aarav Mehta');
  });

  it('10. Admin Identity Check: GET /api/admin/me returns active admin profile', async () => {
    const res = await request(app)
      .get('/api/admin/me')
      .set('Cookie', [adminAuthCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.admin.email).toBe(adminEmail);
    expect(res.body.admin.role).toBe('admin');
  });

  // 8. Admin Logout
  it('11. Admin Logout: POST /api/admin/logout clears the session cookie', async () => {
    const res = await request(app)
      .post('/api/admin/logout')
      .set('Cookie', [adminAuthCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Logged out successfully.');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieStr).toMatch(/admin_token=;|(admin_token=.*Expires=Thu, 01 Jan 1970)|Max-Age=0/i);
  });
});
