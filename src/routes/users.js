const express = require('express');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'], {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be one of: ADMIN, PROJECT_MANAGER, TEAM_MEMBER',
  }),
});

// ── GET /users ── Admin only ──
router.get('/', authorize(['ADMIN']), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
});

// ── PATCH /users/:id ── Admin only, update role ──
router.patch('/:id', authorize(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(200).json({ message: 'User role updated successfully', user });
  } catch (error) {
    return next(error);
  }
});

module.exports = { userRouter: router };
