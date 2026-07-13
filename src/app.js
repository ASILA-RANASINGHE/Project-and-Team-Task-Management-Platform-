const express = require('express');
const cors = require('cors');
const { authRouter } = require('./routes/auth');
const { projectRouter } = require('./routes/projects');
const { taskRouter } = require('./routes/tasks');
const { userRouter } = require('./routes/users');

const app = express();

app.use(cors());

// ── Body parsing ──
app.use(express.json());

// ── Routes ──
app.use('/auth', authRouter);
app.use('/projects', projectRouter);
app.use('/tasks', taskRouter);
app.use('/users', userRouter);

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = { app };
