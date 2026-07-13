const express = require('express');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'projectId is required'),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be one of: TODO, IN_PROGRESS, DONE',
  }),
});

router.get('/', async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    let where = {};

    if (role === 'TEAM_MEMBER') {
      where = { assigneeId: userId };
    } else if (role === 'PROJECT_MANAGER') {
      where = { project: { managerId: userId } };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/',
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  async (req, res, next) => {
    try {
      const parsed = createTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { title, description, projectId, assigneeId, dueDate, priority } = parsed.data;

      const task = await prisma.task.create({
        data: {
          title,
          description,
          projectId,
          assigneeId,
          priority,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      return res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
      return next(error);
    }
  }
);

router.patch(
  '/:id/status',
  authorize(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const parsed = updateStatusSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const task = await prisma.task.findUnique({
        where: { id },
        include: { project: true },
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      if (role === 'TEAM_MEMBER') {
        if (task.assigneeId !== userId) {
          return res.status(403).json({
            message: 'Forbidden: you can only update the status of tasks assigned to you',
          });
        }
      } else if (role === 'PROJECT_MANAGER') {
        if (task.project.managerId !== userId) {
          return res.status(403).json({
            message: 'Forbidden: you can only update tasks in projects you manage',
          });
        }
      }

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
