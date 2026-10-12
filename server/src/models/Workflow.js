import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workflow must be associated with a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Workflow title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    taskType: {
      type: String,
      required: [true, 'Task type is required'],
      enum: {
        values: ['HEALTH_PING', 'PAGE_SCRAPE', 'WEBHOOK_POST', 'DATA_CLEANUP'],
        message: '{VALUE} is not a supported bot task type',
      },
    },
    config: {
      targetUrl: {
        type: String,
        default: '',
        validate: {
          validator: function (v) {
            if (['HEALTH_PING', 'PAGE_SCRAPE', 'WEBHOOK_POST'].includes(this.taskType)) {
              return /^https?:\/\/.+/.test(v);
            }
            return true;
          },
          message: 'A valid HTTP/HTTPS target URL is required for this bot task',
        },
      },
      expectedStatusCode: {
        type: Number,
        default: 200,
      },
      payload: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      timeoutMs: {
        type: Number,
        default: 8000,
        min: 1000,
        max: 30000,
      },
    },
    scheduleIntervalMinutes: {
      type: Number,
      required: [true, 'Schedule interval in minutes is required'],
      min: [1, 'Interval must be at least 1 minute'],
      max: [1440, 'Interval cannot exceed 24 hours (1440 minutes)'],
      default: 5,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    nextRunAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    currentStatus: {
      type: String,
      enum: ['IDLE', 'QUEUED', 'RUNNING', 'SUCCESS', 'FAILED'],
      default: 'IDLE',
      index: true,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for high-performance scheduling checks
workflowSchema.index({ isActive: 1, nextRunAt: 1, currentStatus: 1 });

export default mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);
