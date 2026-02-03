const router = require('express').Router();
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { authorize, checkRole } = require('../middlewares/authMiddleware');

// All routes require Admin role
router.use(authorize);
router.use(checkRole(['admin']));

router.post('/', createUser);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser); // Disables user

module.exports = router;
