const mongoose = require('mongoose');

const rolloverRunSchema = new mongoose.Schema({
  sourceSessionName: { type: String, required: true },
  targetSessionName: { type: String, default: null },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  counts: {
    classesCopied: { type: Number, default: 0 },
    promoted: { type: Number, default: 0 },
    retained: { type: Number, default: 0 }
  },
  message: { type: String, default: '' },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date, default: null }
}, { timestamps: true });

rolloverRunSchema.index({ sourceSessionName: 1, status: 1 });

module.exports = mongoose.model('RolloverRun', rolloverRunSchema);

