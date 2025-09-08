const mongoose = require('mongoose');

const educationProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moduleId: {
    type: String,
    required: true
  },
  completedLessons: [{
    type: String
  }],
  lessonScores: [{
    lessonId: String,
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  attempts: {
    type: Number,
    default: 1
  },
  achievements: [{
    achievementId: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound index for user and module
educationProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

// Index for querying user progress
educationProgressSchema.index({ userId: 1 });

// Virtual for completion percentage
educationProgressSchema.virtual('completionPercentage').get(function() {
  // This would need to be calculated based on the specific module structure
  return this.isCompleted ? 100 : (this.completedLessons.length * 20); // Assuming 5 lessons per module
});

// Method to calculate average lesson score
educationProgressSchema.methods.getAverageScore = function() {
  if (this.lessonScores.length === 0) return 0;
  const totalScore = this.lessonScores.reduce((sum, lesson) => sum + lesson.score, 0);
  return Math.round(totalScore / this.lessonScores.length);
};

// Method to add lesson completion
educationProgressSchema.methods.completeLesson = function(lessonId, score = 100) {
  // Add to completed lessons if not already there
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
  }
  
  // Update or add lesson score
  const existingScoreIndex = this.lessonScores.findIndex(ls => ls.lessonId === lessonId);
  if (existingScoreIndex >= 0) {
    // Keep the highest score
    this.lessonScores[existingScoreIndex].score = Math.max(
      this.lessonScores[existingScoreIndex].score,
      score
    );
    this.lessonScores[existingScoreIndex].completedAt = new Date();
  } else {
    this.lessonScores.push({
      lessonId,
      score,
      completedAt: new Date()
    });
  }
  
  // Update overall score
  this.score = this.getAverageScore();
  
  return this;
};

// Method to mark module as completed
educationProgressSchema.methods.markCompleted = function() {
  this.isCompleted = true;
  this.completedAt = new Date();
  return this;
};

// Static method to get user's overall progress
educationProgressSchema.statics.getUserOverallProgress = async function(userId) {
  const progress = await this.find({ userId });
  
  const totalModules = progress.length;
  const completedModules = progress.filter(p => p.isCompleted).length;
  const totalScore = progress.reduce((sum, p) => sum + p.score, 0);
  const averageScore = totalModules > 0 ? Math.round(totalScore / totalModules) : 0;
  
  return {
    totalModules,
    completedModules,
    completionRate: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
    averageScore,
    lastActivity: progress.length > 0 ? Math.max(...progress.map(p => new Date(p.updatedAt))) : null
  };
};

module.exports = mongoose.model('EducationProgress', educationProgressSchema);