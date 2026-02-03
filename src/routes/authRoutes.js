const router = require('express').Router();
const { register, login, getMe, logout, changePassword } = require('../controllers/authController');
const { authorize } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (Default Role: Staff)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [staff, admin]
 *                 default: staff
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Missing fields
 *       401:
 *         description: User already exists
 */
router.post('/register', register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to the application
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - password
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: System generated User ID (e.g., 1 for Admin)
 *               password:
 *                 type: string
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authorize, getMe);
router.put('/change-password', authorize, changePassword);

module.exports = router;
