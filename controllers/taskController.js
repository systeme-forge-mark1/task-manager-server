const mongoose = require('mongoose');
const Task = require('../models/Task');

const ALLOWED = ['title', 'description', 'priority', 'completed'];
const pick = (body) =>
  Object.fromEntries(Object.entries(body || {}).filter(([k]) => ALLOWED.includes(k)));

const httpError = (status, message) => Object.assign(new Error(message), { status });

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid task id');
};

exports.getTasks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.completed === 'true') filter.completed = true;
    if (req.query.completed === 'false') filter.completed = false;
    const tasks = await Task.find(filter).sort({ completed: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create(pick(req.body));
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    assertValidId(req.params.id);
    const task = await Task.findByIdAndUpdate(req.params.id, pick(req.body), {
      new: true,
      runValidators: true,
    });
    if (!task) throw httpError(404, 'Task not found');
    res.json(task);
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    assertValidId(req.params.id);
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) throw httpError(404, 'Task not found');
    res.json({ message: 'Task deleted', id: task._id });
  } catch (err) {
    next(err);
  }
};
