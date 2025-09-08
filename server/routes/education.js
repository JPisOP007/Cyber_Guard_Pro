const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const EducationProgress = require('../models/EducationProgress');
const User = require('../models/User');

// Education modules configuration
const EDUCATION_MODULES = {
  'phishing-basics': {
    id: 'phishing-basics',
    title: 'Phishing Detection Basics',
    description: 'Learn to identify common phishing attempts',
    difficulty: 'beginner',
    estimatedTime: '15 minutes',
    lessons: [
      {
        id: 'lesson-1',
        title: 'What is Phishing?',
        type: 'content',
        content: 'Phishing overview...',
        questions: []
      },
      {
        id: 'lesson-2',
        title: 'Common Phishing Techniques',
        type: 'interactive',
        content: 'Interactive examples...',
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: 'Which of these is a common sign of a phishing email?',
            options: [
              'Urgent language',
              'Generic greetings',
              'Suspicious links',
              'All of the above'
            ],
            correctAnswer: 3
          }
        ]
      }
    ]
  },
  'password-security': {
    id: 'password-security',
    title: 'Password Security Best Practices',
    description: 'Create and manage secure passwords',
    difficulty: 'beginner',
    estimatedTime: '20 minutes',
    lessons: [
      {
        id: 'lesson-1',
        title: 'Strong Password Principles',
        type: 'content',
        content: 'Password security fundamentals...',
        questions: []
      },
      {
        id: 'lesson-2',
        title: 'Password Manager Usage',
        type: 'interactive',
        content: 'Hands-on password manager demo...',
        questions: []
      }
    ]
  },
  'social-engineering': {
    id: 'social-engineering',
    title: 'Social Engineering Awareness',
    description: 'Recognize and defend against social engineering attacks',
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    lessons: []
  },
  'network-security': {
    id: 'network-security',
    title: 'Network Security Fundamentals',
    description: 'Understand network security concepts',
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    lessons: []
  },
  'incident-response': {
    id: 'incident-response',
    title: 'Incident Response Procedures',
    description: 'Learn how to respond to security incidents',
    difficulty: 'advanced',
    estimatedTime: '35 minutes',
    lessons: []
  }
};

// @route   GET /api/education/modules
// @desc    Get all available education modules
// @access  Private
router.get('/modules', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's progress for all modules
    const userProgress = await EducationProgress.find({ userId });
    const progressMap = new Map(userProgress.map(p => [p.moduleId, p]));
    
    // Combine modules with progress
    const modulesWithProgress = Object.values(EDUCATION_MODULES).map(module => ({
      ...module,
      progress: progressMap.get(module.id) || {
        moduleId: module.id,
        userId,
        completedLessons: [],
        score: 0,
        isCompleted: false,
        startedAt: null,
        completedAt: null
      }
    }));
    
    res.json({
      success: true,
      data: modulesWithProgress
    });
  } catch (error) {
    console.error('Get education modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve education modules',
      error: error.message
    });
  }
});

// @route   GET /api/education/modules/:moduleId
// @desc    Get specific education module
// @access  Private
router.get('/modules/:moduleId', auth, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;
    
    const module = EDUCATION_MODULES[moduleId];
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Education module not found'
      });
    }
    
    // Get user's progress for this module
    let progress = await EducationProgress.findOne({ userId, moduleId });
    
    if (!progress) {
      // Create initial progress record
      progress = new EducationProgress({
        userId,
        moduleId,
        startedAt: new Date()
      });
      await progress.save();
    }
    
    res.json({
      success: true,
      data: {
        ...module,
        progress
      }
    });
  } catch (error) {
    console.error('Get education module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve education module',
      error: error.message
    });
  }
});

// @route   POST /api/education/modules/:moduleId/lessons/:lessonId/complete
// @desc    Mark a lesson as completed and submit answers
// @access  Private
router.post('/modules/:moduleId/lessons/:lessonId/complete', auth, async (req, res) => {
  try {
    const { moduleId, lessonId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;
    
    const module = EDUCATION_MODULES[moduleId];
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Education module not found'
      });
    }
    
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }
    
    // Find or create progress record
    let progress = await EducationProgress.findOne({ userId, moduleId });
    if (!progress) {
      progress = new EducationProgress({
        userId,
        moduleId,
        startedAt: new Date()
      });
    }
    
    // Calculate score for this lesson
    let lessonScore = 0;
    let totalQuestions = lesson.questions.length;
    
    if (totalQuestions > 0 && answers) {
      let correctAnswers = 0;
      lesson.questions.forEach((question, index) => {
        if (answers[question.id] === question.correctAnswer) {
          correctAnswers++;
        }
      });
      lessonScore = Math.round((correctAnswers / totalQuestions) * 100);
    } else {
      // If no questions, consider it completed with full score
      lessonScore = 100;
    }
    
    // Update progress
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
    }
    
    // Update lesson score
    const existingLessonIndex = progress.lessonScores.findIndex(ls => ls.lessonId === lessonId);
    if (existingLessonIndex >= 0) {
      progress.lessonScores[existingLessonIndex].score = Math.max(
        progress.lessonScores[existingLessonIndex].score,
        lessonScore
      );
    } else {
      progress.lessonScores.push({
        lessonId,
        score: lessonScore,
        completedAt: new Date()
      });
    }
    
    // Check if module is completed
    const totalLessons = module.lessons.length;
    if (progress.completedLessons.length >= totalLessons) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
      
      // Calculate overall module score
      const totalScore = progress.lessonScores.reduce((sum, ls) => sum + ls.score, 0);
      progress.score = totalLessons > 0 ? Math.round(totalScore / totalLessons) : 0;
      
      // Award achievement points
      await updateUserAchievements(userId, moduleId, progress.score);
    }
    
    await progress.save();
    
    res.json({
      success: true,
      data: {
        progress,
        lessonScore,
        isModuleCompleted: progress.isCompleted
      }
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete lesson',
      error: error.message
    });
  }
});

// @route   GET /api/education/progress
// @desc    Get user's overall education progress
// @access  Private
router.get('/progress', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const allProgress = await EducationProgress.find({ userId });
    
    // Calculate overall statistics
    const totalModules = Object.keys(EDUCATION_MODULES).length;
    const completedModules = allProgress.filter(p => p.isCompleted).length;
    const overallScore = allProgress.length > 0 
      ? Math.round(allProgress.reduce((sum, p) => sum + p.score, 0) / allProgress.length)
      : 0;
    
    // Calculate total time spent (estimated)
    const totalTimeSpent = allProgress.reduce((total, progress) => {
      const module = EDUCATION_MODULES[progress.moduleId];
      return total + (module ? parseInt(module.estimatedTime) : 0);
    }, 0);
    
    res.json({
      success: true,
      data: {
        overallProgress: {
          totalModules,
          completedModules,
          completionPercentage: Math.round((completedModules / totalModules) * 100),
          overallScore,
          totalTimeSpent,
          lastActivity: allProgress.length > 0 
            ? Math.max(...allProgress.map(p => new Date(p.updatedAt).getTime()))
            : null
        },
        moduleProgress: allProgress,
        achievements: await getUserAchievements(userId)
      }
    });
  } catch (error) {
    console.error('Get education progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve education progress',
      error: error.message
    });
  }
});

// @route   POST /api/education/simulate-phishing
// @desc    Start a phishing simulation
// @access  Private
router.post('/simulate-phishing', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { difficulty = 'beginner' } = req.body;
    
    // Generate phishing simulation based on difficulty
    const simulation = generatePhishingSimulation(difficulty);
    
    // Store simulation session (in a real app, you'd have a SimulationSession model)
    const sessionData = {
      userId,
      simulationId: simulation.id,
      difficulty,
      startedAt: new Date(),
      status: 'active'
    };
    
    res.json({
      success: true,
      data: {
        simulation,
        sessionData
      }
    });
  } catch (error) {
    console.error('Phishing simulation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start phishing simulation',
      error: error.message
    });
  }
});

// Helper function to generate phishing simulation
function generatePhishingSimulation(difficulty) {
  const simulations = {
    beginner: [
      {
        id: 'sim-1',
        type: 'email',
        subject: 'Urgent: Verify your account now!',
        sender: 'security@yourbankk.com',
        content: 'Click here to verify your account immediately or it will be suspended!',
        redFlags: ['Typo in domain', 'Urgent language', 'Generic greeting'],
        isPhishing: true
      }
    ],
    intermediate: [
      {
        id: 'sim-2',
        type: 'website',
        url: 'https://login-microsofft.com',
        content: 'Login page that looks like Microsoft',
        redFlags: ['Domain typosquatting', 'No HTTPS lock icon', 'Poor SSL certificate'],
        isPhishing: true
      }
    ],
    advanced: [
      {
        id: 'sim-3',
        type: 'social',
        scenario: 'Phone call claiming to be from IT support',
        content: 'Caller asks for password to "fix security issue"',
        redFlags: ['Unsolicited contact', 'Password request', 'Pressure tactics'],
        isPhishing: true
      }
    ]
  };
  
  const levelSimulations = simulations[difficulty] || simulations.beginner;
  return levelSimulations[Math.floor(Math.random() * levelSimulations.length)];
}

// Helper function to update user achievements
async function updateUserAchievements(userId, moduleId, score) {
  // In a real app, you'd have an Achievement model
  // For now, just log the achievement
  console.log(`User ${userId} completed module ${moduleId} with score ${score}`);
}

// Helper function to get user achievements
async function getUserAchievements(userId) {
  // Mock achievements - in a real app, retrieve from database
  return [
    { id: 'first-module', name: 'First Steps', description: 'Complete your first module', earned: true },
    { id: 'phishing-expert', name: 'Phishing Expert', description: 'Master phishing detection', earned: false }
  ];
}

module.exports = router;