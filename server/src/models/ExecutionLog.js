import mongoose from 'mongoose';

const executionLogSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: [true, 'Execution log must be linked to a workflow'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Execution log must be linked to a user'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['SUCCESS', 'FAILURE', 'TIMEOUT'],
      index: true,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    durationMs: {
      type: Number,
      required: true,
      min: 0,
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
      default: null,
    },
    executedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for timeline retrieval: fast sort per workflow
executionLogSchema.index({ workflow: 1, executedAt: -1 });

// TTL index: automatically deletes logs older than 30 days
executionLogSchema.index({ executedAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.models.ExecutionLog || mongoose.model('ExecutionLog', executionLogSchema);
