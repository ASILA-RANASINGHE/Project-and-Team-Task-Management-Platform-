const express = require('express');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// ── Apply authentication to all project routes ──
router.use(authenticate);

// ── GET /projects ──
// Admin sees all projects, PM sees own managed projects,
// Team Member sees only projects they are a member of.
router.get('/', async (req, res, next) => {
  try {
    const { userId, role } = req.user;

    let projects;

    if (role === 'ADMIN') {
      projects = await prisma.project.findMany({
        include: { manager: { select: { id: true, name: true, email: true } }, members: true, tasks: true },
      });
    } else if (role === 'PROJECT_MANAGER') {
      projects = await prisma.project.findMany({
        where: { managerId: userId },
        include: { manager: { select: { id: true, name: true, email: true } }, members: true, tasks: true },
      });
    } else {
      // TEAM_MEMBER – only projects they belong to
      projects = await prisma.project.findMany({
        where: { members: { some: { userId } } },
        include: { manager: { select: { id: true, name: true, email: true } }, members: true, tasks: true },
      });
    }

    return res.status(200).json({ projects });
  } catch (error) {
    return next(error);
  }
});

// ── Validation schemas ──
const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  description: z.string().trim().optional(),
});

// ── POST /projects ──
// Only Admin and Project Manager can create projects.
router.post('/', authorize(['ADMIN', 'PROJECT_MANAGER']), async (req, res, next) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, description } = parsed.data;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        managerId: req.user.userId,
      },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });

    return res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    return next(error);
  }
});

module.exports = { projectRouter: router };
