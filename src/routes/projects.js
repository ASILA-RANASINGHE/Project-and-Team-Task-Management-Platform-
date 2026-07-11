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

module.exports = { projectRouter: router };
