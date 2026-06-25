const express = require('express');

const router = express.Router();

router.get('/health', (req, res) =>
  res.json({ service: 'notification-service', status: 'ok' })
);

module.exports = router;
