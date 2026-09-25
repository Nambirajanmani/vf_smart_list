const fs = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, '..', 'data', 'voice_logs.json');
const DATASET_FILE = path.join(__dirname, '..', 'data', 'voice_training_dataset.json');

// Ensure data directory and logs file exist
function ensureLogsFile() {
  const dataDir = path.dirname(LOGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

/**
 * POST /api/voice/log
 * Collects live user voice queries, extracted entities, and model confidence scores
 */
const logVoiceQuery = async (req, res) => {
  try {
    const { utterance, lang, action, matchedItems } = req.body;
    if (!utterance || !utterance.trim()) {
      return res.status(400).json({ error: 'Utterance is required.' });
    }

    ensureLogsFile();

    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      utterance: utterance.trim(),
      lang: lang || 'en',
      action: action || 'UNKNOWN',
      matchedItems: matchedItems || [],
      user_accepted: true
    };

    let existingLogs = [];
    try {
      const content = fs.readFileSync(LOGS_FILE, 'utf-8');
      existingLogs = JSON.parse(content);
      if (!Array.isArray(existingLogs)) existingLogs = [];
    } catch {
      existingLogs = [];
    }

    existingLogs.push(logEntry);

    // Keep up to 2,000 most recent logs
    if (existingLogs.length > 2000) {
      existingLogs = existingLogs.slice(existingLogs.length - 2000);
    }

    fs.writeFileSync(LOGS_FILE, JSON.stringify(existingLogs, null, 2), 'utf-8');

    return res.status(201).json({ success: true, logId: logEntry.id });
  } catch (err) {
    console.error('logVoiceQuery error:', err);
    return res.status(500).json({ error: 'Failed to log voice query.' });
  }
};

/**
 * GET /api/voice/dataset
 * Returns the training dataset for inspection, evaluation, or fine-tuning
 */
const getDataset = async (req, res) => {
  try {
    if (fs.existsSync(DATASET_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATASET_FILE, 'utf-8'));
      return res.json(data);
    }
    return res.json({ metadata: {}, samples: [] });
  } catch (err) {
    console.error('getDataset error:', err);
    return res.status(500).json({ error: 'Failed to read dataset.' });
  }
};

/**
 * GET /api/voice/logs
 * Returns live recorded queries from shoppers
 */
const getVoiceLogs = async (req, res) => {
  try {
    ensureLogsFile();
    const data = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    return res.json(data);
  } catch (err) {
    console.error('getVoiceLogs error:', err);
    return res.status(500).json({ error: 'Failed to read voice logs.' });
  }
};

module.exports = {
  logVoiceQuery,
  getDataset,
  getVoiceLogs
};
