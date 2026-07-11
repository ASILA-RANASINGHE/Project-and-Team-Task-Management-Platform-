const request = require('supertest');
const bcrypt = require('bcrypt');
const { app } = require('../../src/app');
const { prisma } = require('../../src/lib/prisma');

// ── Test data ──
const TEST_USER = {
  name: 'Test User',
  email: 'test-login@example.com',
  password: 'SecurePass123',
};

describe('POST /auth/login', () => {
  let hashedPassword;

  // ── Setup: create a user in the DB before tests run ──
  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(TEST_USER.password, 12);

    // Clean up any leftover from a previous run
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });

    await prisma.user.create({
      data: {
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: hashedPassword,
      },
    });
  });

  // ── Teardown: remove the test user and disconnect Prisma ──
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
    await prisma.$disconnect();
  });

  // ────────────────────────────────────────────────────────
  // ✅ Success case
  // ────────────────────────────────────────────────────────
  it('should return 200 and a JWT token for valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);

    // Should also return user data without the password
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email', TEST_USER.email);
    expect(res.body.user).toHaveProperty('name', TEST_USER.name);
    expect(res.body.user).not.toHaveProperty('password');
  });

  // ────────────────────────────────────────────────────────
  // ❌ Wrong password
  // ────────────────────────────────────────────────────────
  it('should return 401 for an incorrect password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: TEST_USER.email,
        password: 'WrongPassword999',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/invalid/i);
    expect(res.body).not.toHaveProperty('token');
  });

  // ────────────────────────────────────────────────────────
  // ❌ Non-existent email
  // ────────────────────────────────────────────────────────
  it('should return 401 for a non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'DoesNotMatter123',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('token');
  });

  // ────────────────────────────────────────────────────────
  // ❌ Missing fields (validation)
  // ────────────────────────────────────────────────────────
  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'SomePassword123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_USER.email });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });
});
