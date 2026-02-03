const router = require('express').Router();
const { getSettings, updateSetting } = require('../controllers/settingController');
const { authorize, checkRole } = require('../middlewares/authMiddleware');

router.use(authorize);

router.get('/', getSettings);
router.put('/:key', checkRole(['admin']), updateSetting);

module.exports = router;
