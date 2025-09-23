const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const EducationProgress = require('../models/EducationProgress');
const User = require('../models/User');

// Education modules configuration (rich content)
const EDUCATION_MODULES = {
  'phishing-basics': {
    id: 'phishing-basics',
    title: 'Phishing Detection Basics',
    description: 'Learn to identify common phishing attempts across email, web, and social channels.',
    difficulty: 'beginner',
    estimatedTime: '25 minutes',
    topics: [
      'Email red flags',
      'Suspicious links & attachments',
      'Sender spoofing',
      'Reporting procedures'
    ],
    lessons: [
      {
        id: 'lesson-1',
        title: 'What is Phishing?',
        type: 'content',
        content: 'Phishing is a form of social engineering where attackers trick you into revealing sensitive information or installing malware. They often impersonate trusted brands or coworkers and use urgency or fear to prompt quick action.',
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: 'Phishing primarily relies on which tactic to succeed?',
            options: ['Strong encryption', 'Social manipulation', 'Zero-day exploits', 'Hardware tampering'],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'lesson-2',
        title: 'Email Red Flags',
        type: 'content',
        content: 'Look for mismatched sender domains, generic greetings, spelling mistakes, urgent language, unexpected attachments, or links that do not match the visible text.',
        questions: [
          {
            id: 'q2',
            type: 'multiple-choice',
            question: 'Which is the safest action when unsure about a link in an email?',
            options: ['Click it quickly to verify', 'Hover to inspect the URL first', 'Forward it to everyone', 'Reply with your credentials'],
            correctAnswer: 1
          },
          {
            id: 'q3',
            type: 'multiple-choice',
            question: '“Your account will be suspended in 30 minutes unless you verify now.” This is an example of:',
            options: ['Polite language', 'Urgency & pressure', 'Multi-factor auth', 'Email encryption'],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'lesson-3',
        title: 'Links and Attachments',
        type: 'content',
        content: 'Never open unexpected attachments. For links, hover to preview the true destination. Watch for typosquatting (amaz0n.com), subdomain tricks (login.bank.com.attacker.com), or missing HTTPS on sensitive pages.',
        questions: [
          {
            id: 'q4',
            type: 'multiple-choice',
            question: 'A file named “invoice.pdf.exe” is likely:',
            options: ['A safe PDF', 'An image file', 'An executable malware', 'A spreadsheet'],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'lesson-4',
        title: 'Reporting and Response',
        type: 'content',
        content: 'If you suspect phishing, do not click links or reply. Report it to your security team using the official channel. If you clicked, disconnect from the network and notify IT immediately.',
        questions: [
          {
            id: 'q5',
            type: 'multiple-choice',
            question: 'Upon receiving a suspicious email, the best first step is to:',
            options: ['Reply for clarification', 'Forward to colleagues', 'Report via the official channel', 'Delete and ignore'],
            correctAnswer: 2
          }
        ]
      }
    ]
  },
  'password-security': {
    id: 'password-security',
    title: 'Password Security Best Practices',
    description: 'Create, store, and manage strong passwords and passphrases safely.',
    difficulty: 'beginner',
    estimatedTime: '25 minutes',
    topics: ['Passphrases', 'Password managers', 'MFA', 'Rotation & reuse'],
    lessons: [
      {
        id: 'lesson-1',
        title: 'Strong Passwords & Passphrases',
        type: 'content',
        content: 'Use long, unique passphrases (e.g., 4–5 random words). Avoid reuse across sites. Length and uniqueness beat complexity tricks.',
        questions: [
          { id: 'q1', type: 'multiple-choice', question: 'Which is strongest?', options: ['P@ssw0rd1', 'CorrectHorseBatteryStaple', 'Summer2024!', '12345678'], correctAnswer: 1 }
        ]
      },
      {
        id: 'lesson-2',
        title: 'Password Managers',
        type: 'content',
        content: 'Use a reputable password manager to generate and store unique credentials securely. Protect it with a strong master passphrase and MFA.',
        questions: [
          { id: 'q2', type: 'multiple-choice', question: 'Password managers help by:', options: ['Storing and generating unique passwords', 'Sharing passwords with anyone', 'Disabling MFA', 'Making passwords shorter'], correctAnswer: 0 }
        ]
      },
      {
        id: 'lesson-3',
        title: 'Multi-Factor Authentication (MFA)',
        type: 'content',
        content: 'Enable MFA wherever possible. Prefer authenticator apps or hardware keys over SMS when available.',
        questions: [
          { id: 'q3', type: 'multiple-choice', question: 'Which MFA method is generally strongest?', options: ['Email codes', 'Security key (FIDO2/U2F)', 'SMS', 'Knowledge-based questions'], correctAnswer: 1 }
        ]
      },
      {
        id: 'lesson-4',
        title: 'Rotation & Reuse',
        type: 'content',
        content: 'Do not reuse passwords. Change compromised credentials immediately. Use breach alert services to monitor exposure.',
        questions: [
          { id: 'q4', type: 'multiple-choice', question: 'Password reuse is risky because:', options: ['Websites share breaches responsibly', 'One breach can unlock many accounts', 'It helps memorization', 'It improves security'], correctAnswer: 1 }
        ]
      }
    ]
  },
  'social-engineering': {
    id: 'social-engineering',
    title: 'Social Engineering Awareness',
    description: 'Recognize pretexting, baiting, tailgating, and vishing tactics.',
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    topics: ['Pretexting', 'Vishing', 'Baiting', 'Tailgating'],
    lessons: [
      { id: 'lesson-1', title: 'Pretexting', type: 'content', content: 'Attackers invent a believable story (pretext) to extract info.', questions: [ { id: 'q1', type: 'multiple-choice', question: 'Pretexting relies on:', options: ['Malware only', 'A fabricated scenario', 'Firewall bypass', 'Backups'], correctAnswer: 1 } ] },
      { id: 'lesson-2', title: 'Vishing', type: 'content', content: 'Voice phishing uses phone calls pretending to be IT, bank, or support.', questions: [ { id: 'q2', type: 'multiple-choice', question: 'Best response to unsolicited password request over phone:', options: ['Provide it quickly', 'Refuse and verify via official channel', 'Email it instead', 'Ignore and hang up without reporting'], correctAnswer: 1 } ] },
      { id: 'lesson-3', title: 'Baiting', type: 'content', content: 'Free USBs or downloads lure victims. Never plug unknown media.', questions: [ { id: 'q3', type: 'multiple-choice', question: 'Found USB in parking lot—what do you do?', options: ['Plug it in to check', 'Give to security/IT', 'Take it home', 'Throw in public trash'], correctAnswer: 1 } ] },
      { id: 'lesson-4', title: 'Tailgating', type: 'content', content: 'Follow-on access without badge. Always challenge politely or report.', questions: [ { id: 'q4', type: 'multiple-choice', question: 'Tailgating mitigation includes:', options: ['Sharing badges', 'Holding doors for all', 'Enforcing badge checks', 'Disabling cameras'], correctAnswer: 2 } ] }
    ]
  },
  'network-security': {
    id: 'network-security',
    title: 'Network Security Fundamentals',
    description: 'Understand key protections: segmentation, encryption, and monitoring.',
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    topics: ['Segmentation', 'TLS/HTTPS', 'Firewalling', 'Monitoring'],
    lessons: [
      { id: 'lesson-1', title: 'Segmentation', type: 'content', content: 'Break networks into zones (prod/dev) to limit blast radius.', questions: [ { id: 'q1', type: 'multiple-choice', question: 'Segmentation reduces:', options: ['User count', 'Attack surface & lateral movement', 'Bandwidth', 'Backups'], correctAnswer: 1 } ] },
      { id: 'lesson-2', title: 'TLS & HTTPS', type: 'content', content: 'Encrypt in transit with TLS. Always validate certs and avoid mixed content.', questions: [ { id: 'q2', type: 'multiple-choice', question: 'A broken lock icon indicates:', options: ['Strong TLS', 'No or invalid HTTPS', 'Faster site', 'Safe site'], correctAnswer: 1 } ] },
      { id: 'lesson-3', title: 'Firewalls & NAC', type: 'content', content: 'Use least privilege rules; network access control for device posture.', questions: [ { id: 'q3', type: 'multiple-choice', question: 'Principle of least privilege means:', options: ['Allow all by default', 'Only necessary access', 'Open all outbound', 'Disable logging'], correctAnswer: 1 } ] },
      { id: 'lesson-4', title: 'Monitoring & Alerts', type: 'content', content: 'Collect logs, use IDS/IPS, define playbooks to respond swiftly.', questions: [ { id: 'q4', type: 'multiple-choice', question: 'Effective detection needs:', options: ['No logs', 'Tuned alerts and playbooks', 'Random emails', 'Unaudited access'], correctAnswer: 1 } ] }
    ]
  },
  'incident-response': {
    id: 'incident-response',
    title: 'Incident Response Procedures',
    description: 'Prepare, detect, contain, eradicate, recover, and learn.',
    difficulty: 'advanced',
    estimatedTime: '35 minutes',
    topics: ['Preparation', 'Containment', 'Eradication', 'Recovery', 'Lessons learned'],
    lessons: [
      { id: 'lesson-1', title: 'Preparation', type: 'content', content: 'Define roles, run tabletop exercises, and maintain contacts & runbooks.', questions: [ { id: 'q1', type: 'multiple-choice', question: 'Preparation improves:', options: ['Response time & clarity', 'Malware stealth', 'Downtime', 'Confusion'], correctAnswer: 0 } ] },
      { id: 'lesson-2', title: 'Detection & Analysis', type: 'content', content: 'Triage alerts, validate indicators, assess scope and impact quickly.', questions: [ { id: 'q2', type: 'multiple-choice', question: 'First step after an alert:', options: ['Erase logs', 'Validate and triage', 'Publicly tweet', 'Ignore'], correctAnswer: 1 } ] },
      { id: 'lesson-3', title: 'Containment & Eradication', type: 'content', content: 'Isolate affected systems, remove persistence, rotate creds, patch.', questions: [ { id: 'q3', type: 'multiple-choice', question: 'Containment action:', options: ['Disable MFA', 'Isolate compromised host', 'Share creds', 'Increase attack surface'], correctAnswer: 1 } ] },
      { id: 'lesson-4', title: 'Recovery & Lessons Learned', type: 'content', content: 'Restore from clean backups, monitor closely, document and improve.', questions: [ { id: 'q4', type: 'multiple-choice', question: 'Post-incident review should:', options: ['Assign blame only', 'Ignore root causes', 'Capture lessons and update playbooks', 'Delete evidence'], correctAnswer: 2 } ] }
    ]
  },
  // New modules to provide fuller content coverage
  'secure-browsing': {
    id: 'secure-browsing',
    title: 'Secure Browsing & Malware Prevention',
    description: 'Browse safely, avoid drive-by downloads, and recognize malicious ads/extensions.',
    difficulty: 'beginner',
    estimatedTime: '20 minutes',
    topics: ['Safe downloads', 'Browser hygiene', 'Extensions', 'Ad/tracker risks'],
    lessons: [
      { id: 'lesson-1', title: 'Safe Downloading', type: 'content', content: 'Only download from trusted vendors. Verify checksums/signatures when offered. Avoid “free crack” sites.', questions: [ { id: 'q1', type: 'multiple-choice', question: 'Safer source for software:', options: ['Random forum link', 'Vendor site or trusted store', 'Torrent mirror', 'URL shortener'], correctAnswer: 1 } ] },
      { id: 'lesson-2', title: 'Browser Hygiene', type: 'content', content: 'Keep your browser updated. Disable or remove unused plugins. Clear cookies for suspicious sessions.', questions: [ { id: 'q2', type: 'multiple-choice', question: 'Outdated plugins often lead to:', options: ['Faster pages', 'Vulnerabilities', 'Better UX', 'No effect'], correctAnswer: 1 } ] },
      { id: 'lesson-3', title: 'Extensions & Permissions', type: 'content', content: 'Review extension permissions; remove those you don’t trust or use. Beware of extension hijacks after acquisitions.', questions: [ { id: 'q3', type: 'multiple-choice', question: 'Excessive extension permissions can:', options: ['Improve battery', 'Limit tracking', 'Exfiltrate data', 'Block malware always'], correctAnswer: 2 } ] },
      { id: 'lesson-4', title: 'Malvertising & Trackers', type: 'content', content: 'Malicious ads can inject scripts. Use content blockers and avoid clicking shady banners.', questions: [ { id: 'q4', type: 'multiple-choice', question: 'Best defense against malvertising:', options: ['Click ads to close them', 'Run content/advert blockers', 'Install more toolbars', 'Disable HTTPS'], correctAnswer: 1 } ] }
    ]
  },
  'data-protection': {
    id: 'data-protection',
    title: 'Data Protection & Compliance Basics',
    description: 'Understand PII/PHI, classification, encryption, and handling guidelines for compliance.',
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    topics: ['PII/PHI', 'Classification', 'Encryption', 'Handling & retention'],
    lessons: [
      { id: 'lesson-1', title: 'Know Your Data', type: 'content', content: 'Identify sensitive data types (PII/PHI/PCI). Classify and handle accordingly.', questions: [ { id: 'q1', type: 'multiple-choice', question: 'PII includes:', options: ['CPU usage', 'Email address', 'App version', 'CSS file'], correctAnswer: 1 } ] },
      { id: 'lesson-2', title: 'Encryption Essentials', type: 'content', content: 'Encrypt data in transit (TLS) and at rest (disk/db). Protect keys; rotate regularly.', questions: [ { id: 'q2', type: 'multiple-choice', question: 'Encrypting “in transit” means:', options: ['While stored on disk', 'During network transfer', 'In memory only', 'Never encrypt'], correctAnswer: 1 } ] },
      { id: 'lesson-3', title: 'Handling & Sharing', type: 'content', content: 'Share sensitive data only via approved methods. Use secure portals; avoid email attachments when possible.', questions: [ { id: 'q3', type: 'multiple-choice', question: 'Sensitive docs should be shared via:', options: ['Public link', 'Approved secure portal', 'Personal email', 'Chat screenshot'], correctAnswer: 1 } ] },
      { id: 'lesson-4', title: 'Retention & Disposal', type: 'content', content: 'Follow retention schedules; securely erase when no longer needed.', questions: [ { id: 'q4', type: 'multiple-choice', question: 'End-of-life data should be:', options: ['Saved forever', 'Shared widely', 'Securely destroyed', 'Printed'], correctAnswer: 2 } ] }
    ]
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
    
    // Calculate score for this lesson (accept numeric or string answers)
    let lessonScore = 0;
    const totalQuestions = Array.isArray(lesson.questions) ? lesson.questions.length : 0;
    if (totalQuestions > 0 && answers) {
      let correctAnswers = 0;
      lesson.questions.forEach((question) => {
        const ans = answers[question.id];
        let isCorrect = false;
        if (typeof ans === 'number') {
          isCorrect = ans === question.correctAnswer;
        } else if (typeof ans === 'string') {
          const expected = Array.isArray(question.options) ? question.options[question.correctAnswer] : undefined;
          isCorrect = expected != null && ans.trim() === expected;
        } else if (ans != null) {
          const num = Number(ans);
          if (!Number.isNaN(num)) isCorrect = num === question.correctAnswer;
        }
        if (isCorrect) correctAnswers++;
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

// @route   POST /api/education/simulations/:simulationId/result
// @desc    Submit phishing simulation result (mock)
// @access  Private
router.post('/simulations/:simulationId/result', auth, async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { success, detectedFlags = [] } = req.body || {};
    // In a real app, persist result and update achievements
    const result = {
      simulationId,
      success: !!success,
      detectedFlags,
      scoredAt: new Date(),
    };
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Submit simulation result error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit simulation result', error: error.message });
  }
});

// @route   GET /api/education/achievements
// @desc    Get user achievements (mock)
// @access  Private
router.get('/achievements', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const achievements = await getUserAchievements(userId);
    res.json({ success: true, data: achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve achievements', error: error.message });
  }
});

// @route   GET /api/education/certificates
// @desc    Get user certificates (mock)
// @access  Private
router.get('/certificates', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    // In a real app fetch from DB; here, derive from completed modules
    const userProgress = await EducationProgress.find({ userId, isCompleted: true });
    // Only issue certificates for modules with passing score (>= 60)
    const certificates = userProgress.filter(p => (p.score ?? 0) >= 60).map(p => ({
      id: `cert-${p.moduleId}`,
      moduleId: p.moduleId,
      title: `${EDUCATION_MODULES[p.moduleId]?.title || p.moduleId} — Completion Certificate`,
      issuedAt: p.completedAt || p.updatedAt,
      score: p.score,
      url: `https://example.com/certificates/${userId}/${p.moduleId}`,
    }));
    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve certificates', error: error.message });
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
        preview: 'Click to verify your account immediately or it will be suspended!',
        content: 'Dear user, your account is at risk. Verify now using the link below to prevent suspension.',
        tips: 'Hover links before clicking. Verify sender domain carefully.',
        flags: ['Typo in domain', 'Urgent language', 'Generic greeting'],
        isPhishing: true
      },
      {
        id: 'sim-1b',
        type: 'email',
        subject: 'Prize Winner! Claim now',
        sender: 'promo@amaz0n-rewards.com',
        preview: 'You won a gift card. Click here to claim.',
        content: 'Congratulations! You are selected for a gift card. Provide card details to receive funds.',
        tips: 'Unexpected prizes are classic bait. Never share payment info via email.',
        flags: ['Typosquatting domain', 'Unsolicited prize', 'Payment info request'],
        isPhishing: true
      },
      {
        id: 'sim-1c',
        type: 'email',
        subject: 'Weekly newsletter from your bank',
        sender: 'newsletter@yourbank.com',
        preview: 'Market insights and security tips.',
        content: 'Welcome to your bank newsletter. Tips to keep your account safe.',
        tips: 'Legitimate senders rarely demand immediate action. No credential request here.',
        flags: [],
        isPhishing: false
      }
    ],
    intermediate: [
      {
        id: 'sim-2',
        type: 'website',
        url: 'https://login-microsofft.com',
        sender: 'web@simulation',
        preview: 'A login page imitating Microsoft sign-in.',
        content: 'Replica login asking for credentials.',
        tips: 'Check the address bar and certificate details.',
        flags: ['Domain typosquatting', 'No HTTPS lock icon', 'Poor SSL certificate'],
        isPhishing: true
      },
      {
        id: 'sim-2b',
        type: 'sms',
        sender: '+1 (555) 010-1337',
        preview: 'Your package is held. Pay customs fee here: short.ly/xyz',
        content: 'Parcel pending. Complete payment now to avoid return.',
        tips: 'Short links obscure destinations. Verify with the courier directly.',
        flags: ['Shortened link', 'Payment request', 'Unknown sender'],
        isPhishing: true
      },
      {
        id: 'sim-2c',
        type: 'email',
        subject: 'Security alert: New login from your device',
        sender: 'no-reply@accounts.example.com',
        preview: 'If this was not you, secure your account here.',
        content: 'We detected a new login. Review activity in your account settings.',
        tips: 'Legit messages link to the domain’s official security page.',
        flags: [],
        isPhishing: false
      }
    ],
    advanced: [
      {
        id: 'sim-3',
        type: 'social',
        scenario: 'Phone call claiming to be from IT support',
        sender: 'it-support@simulation',
        preview: 'Caller asks for password to “fix security issue”.',
        content: 'Caller insists on credentials to apply urgent patch.',
        tips: 'IT will never ask for your password. Use official ticketing to verify.',
        flags: ['Unsolicited contact', 'Password request', 'Pressure tactics'],
        isPhishing: true
      },
      {
        id: 'sim-3b',
        type: 'social',
        scenario: 'Vendor invoice callback scam',
        sender: 'billing@trusted-vendor.com',
        preview: 'Asks to call a new number to change banking details.',
        content: 'Please update our bank account for wire transfers via the new number.',
        tips: 'Always verify changes using previously known contacts.',
        flags: ['Bank detail change', 'New phone number', 'Sense of urgency'],
        isPhishing: true
      },
      {
        id: 'sim-3c',
        type: 'social',
        scenario: 'Security training reminder',
        sender: 'training@corp.example',
        preview: 'Reminder to complete your quarterly training.',
        content: 'Please complete your training on the corporate LMS.',
        tips: 'Legitimate reminder—links to internal LMS portal.',
        flags: [],
        isPhishing: false
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
  // Derive achievements from EducationProgress
  const progress = await EducationProgress.find({ userId });
  const byModule = new Map(progress.map(p => [p.moduleId, p]));

  const totalModules = Object.keys(EDUCATION_MODULES).length;
  const completedCount = progress.filter(p => p.isCompleted).length;
  const anyCompleted = completedCount > 0;
  const allBeginnerCompleted = Object.values(EDUCATION_MODULES)
    .filter(m => m.difficulty === 'beginner')
    .every(m => byModule.get(m.id)?.isCompleted);
  const anyPerfect = progress.some(p => p.isCompleted && (p.score ?? 0) === 100);
  const allModulesCompleted = completedCount === totalModules && totalModules > 0;

  return [
    {
      id: 'first-module',
      title: 'First Steps',
      description: 'Complete your first training module.',
      earned: anyCompleted,
    },
    {
      id: 'spud-spotter',
      title: 'Spud Spotter',
      description: 'Complete all beginner (fresh potato) modules.',
      earned: allBeginnerCompleted,
    },
    {
      id: 'golden-potato',
      title: 'Golden Potato',
      description: 'Achieve a perfect score (100%) in any module.',
      earned: anyPerfect,
    },
    {
      id: 'harvest-master',
      title: 'Harvest Master',
      description: 'Complete all available modules.',
      earned: allModulesCompleted,
    },
  ];
}

module.exports = router;