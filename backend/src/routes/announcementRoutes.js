const express = require('express');
const AnnouncementController = require('../controllers/announcementController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', AnnouncementController.getActiveAnnouncements);

module.exports = router;
