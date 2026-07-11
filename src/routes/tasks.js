const express = require('express');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// ── Apply authentication to all task routes ──
router.use(authenticate);

// ── Validation schema ──
const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be one of: TODO, IN_PROGRESS, DONE',
  }),
});

// ── PATCH /tasks/:id/status ──
// Team Member can only update status if they are the assignee.
// PM can update status of any task within their managed projects.
// Admin can update status of any task.
router.patch(
  '/:id/status',
  authorize(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      // Validate the incoming status value
      const parsed = updateStatusSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      // Fetch the task with its parent project
      const task = await prisma.task.findUnique({
        where: { id },
        include: { project: true },
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // ── Role-based access checks ──
      if (role === 'TEAM_MEMBER') {
        // Team Members can only update tasks assigned to them
        if (task.assigneeId !== userId) {
          return res.status(403).json({
            message: 'Forbidden: you can only update the status of tasks assigned to you',
          });
        }
      } else if (role === 'PROJECT_MANAGER') {
        // PMs can only update tasks within projects they manage
        if (task.project.managerId !== userId) {
          return res.status(403).json({
            message: 'Forbidden: you can only update tasks in projects you manage',
          });
        }
      }
      // ADMIN – no restriction

      const updatedTask = await prisma.task.update({
        where: { id },
        data: { status: parsed.data.status },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      return res.status(200).json({
        message: 'Task status updated successfully',
        task: updatedTask,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = { taskRouter: router };
