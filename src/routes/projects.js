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

const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').optional(),
  description: z.string().trim().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// ── PATCH /projects/:id ──
// Admin can update any project. PM can update only their own managed projects.
// Team Members cannot update projects.
router.patch('/:id', authorize(['ADMIN', 'PROJECT_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    // Verify the project exists
    const existing = await prisma.project.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // PM can only update projects they manage
    if (role === 'PROJECT_MANAGER' && existing.managerId !== userId) {
      return res.status(403).json({ message: 'Forbidden: you can only update projects you manage' });
    }

    const parsed = updateProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
      include: { manager: { select: { id: true, name: true, email: true } } },
    });

    return res.status(200).json({ message: 'Project updated successfully', project });
  } catch (error) {
    return next(error);
  }
});

// ── DELETE /projects/:id ──
// Admin can delete any project. PM can delete only their own managed projects.
// Team Members cannot delete projects.
router.delete('/:id', authorize(['ADMIN', 'PROJECT_MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const existing = await prisma.project.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // PM can only delete projects they manage
    if (role === 'PROJECT_MANAGER' && existing.managerId !== userId) {
      return res.status(403).json({ message: 'Forbidden: you can only delete projects you manage' });
    }

    await prisma.project.delete({ where: { id } });

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

module.exports = { projectRouter: router };
