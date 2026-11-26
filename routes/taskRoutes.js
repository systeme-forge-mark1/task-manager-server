const router = require('express').Router();
const c = require('../controllers/taskController');

router.route('/').get(c.getTasks).post(c.createTask);
router.route('/:id').put(c.updateTask).patch(c.updateTask).delete(c.deleteTask);

module.exports = router;
