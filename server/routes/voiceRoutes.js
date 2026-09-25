const express = require('express');
const router = express.Router();
const {
  logVoiceQuery,
  getDataset,
  getVoiceLogs
} = require('../controllers/voiceController');

// POST /api/voice/log      → Record spoken command & extracted products
router.post('/log', logVoiceQuery);

// GET  /api/voice/dataset  → Retrieve training dataset
router.get('/dataset', getDataset);

// GET  /api/voice/logs     → Retrieve live user interaction logs
router.get('/logs', getVoiceLogs);

module.exports = router;
