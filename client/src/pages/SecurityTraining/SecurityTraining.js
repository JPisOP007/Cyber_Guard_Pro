import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, LinearProgress,
  Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, Select, MenuItem, InputLabel, Stepper, Step, StepLabel,
  StepContent, RadioGroup, FormControlLabel, Radio, Alert, Tabs, Tab,
  List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
  IconButton, Tooltip, CircularProgress, Divider, Paper
} from '@mui/material';
import {
  School as SchoolIcon, Security as SecurityIcon, Quiz as QuizIcon,
  EmojiEvents as TrophyIcon, PlayArrow as PlayIcon, CheckCircle as CheckIcon,
  Schedule as ClockIcon, Star as StarIcon, TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon, Computer as ComputerIcon, Psychology as BrainIcon,
  Phishing as PhishingIcon, Lock as LockIcon, People as PeopleIcon,
  Assessment as AssessmentIcon, VerifiedUser as CertificateIcon
} from '@mui/icons-material';
import { educationAPI } from '../../services/api';

const SecurityTraining = () => {
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [lessonAnswers, setLessonAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [phishingSimulation, setPhishingSimulation] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);

  useEffect(() => {
    loadEducationData();
  }, []);

  const loadEducationData = async () => {
    try {
      const [modulesRes, progressRes] = await Promise.all([
        educationAPI.getModules(),
        educationAPI.getProgress()
      ]);
      
      setModules(modulesRes.data.data);
      setProgress(progressRes.data.data);
    } catch (error) {
      console.error('Failed to load education data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return <ShieldIcon />;
      case 'intermediate': return <ComputerIcon />;
      case 'advanced': return <BrainIcon />;
      default: return <SecurityIcon />;
    }
  };

  const getModuleIcon = (moduleId) => {
    switch (moduleId) {
      case 'phishing-basics': return <PhishingIcon />;
      case 'password-security': return <LockIcon />;
      case 'social-engineering': return <PeopleIcon />;
      case 'network-security': return <ComputerIcon />;
      case 'incident-response': return <AssessmentIcon />;
      default: return <SecurityIcon />;
    }
  };

  const startModule = async (module) => {
    try {
      const response = await educationAPI.getModule(module.id);
      setSelectedModule(response.data.data);
      setActiveLesson(0);
      setLessonAnswers({});
    } catch (error) {
      console.error('Failed to start module:', error);
    }
  };

  const completeLesson = async (lessonId) => {
    if (!selectedModule) return;

    try {
      const response = await educationAPI.completeLesson(
        selectedModule.id,
        lessonId,
        lessonAnswers[lessonId]
      );
      
      if (response.data.success) {
        // Update progress
        await loadEducationData();
        
        // Move to next lesson or complete module
        if (activeLesson < selectedModule.lessons.length - 1) {
          setActiveLesson(activeLesson + 1);
        } else {
          // Module completed
          setSelectedModule(null);
        }
      }
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    }
  };

  const handleAnswerChange = (lessonId, questionId, answer) => {
    setLessonAnswers(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        [questionId]: answer
      }
    }));
  };

  const startPhishingSimulation = async (difficulty = 'beginner') => {
    setSimulationLoading(true);
    try {
      const response = await educationAPI.startPhishingSimulation(difficulty);
      setPhishingSimulation(response.data.data);
    } catch (error) {
      console.error('Failed to start phishing simulation:', error);
    } finally {
      setSimulationLoading(false);
    }
  };

  const renderModuleCard = (module) => (
    <Card key={module.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {getModuleIcon(module.id)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {module.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip
                size="small"
                label={module.difficulty}
                color={getDifficultyColor(module.difficulty)}
                icon={getDifficultyIcon(module.difficulty)}
              />
              <Chip
                size="small"
                label={module.estimatedTime}
                icon={<ClockIcon />}
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          {module.description}
        </Typography>

        {module.progress && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Progress</Typography>
              <Typography variant="body2">
                {module.progress.completedLessons?.length || 0}/{module.lessons?.length || 0}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={module.lessons?.length ? (module.progress.completedLessons?.length || 0) / module.lessons.length * 100 : 0}
              sx={{ mb: 1 }}
            />
            {module.progress.score > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon color="warning" fontSize="small" />
                <Typography variant="body2">{module.progress.score}% Score</Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
      
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant={module.progress?.isCompleted ? 'outlined' : 'contained'}
          onClick={() => startModule(module)}
          startIcon={module.progress?.isCompleted ? <CheckIcon /> : <PlayIcon />}
        >
          {module.progress?.isCompleted ? 'Review' : module.progress?.completedLessons?.length > 0 ? 'Continue' : 'Start'}
        </Button>
      </Box>
    </Card>
  );

  const renderLessonContent = (lesson) => (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>{lesson.title}</Typography>
      <Typography variant="body1" paragraph>
        {lesson.content || 'Interactive lesson content will be displayed here.'}
      </Typography>
      
      {lesson.questions && lesson.questions.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Knowledge Check</Typography>
          {lesson.questions.map((question, qIndex) => (
            <Box key={question.id} sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                {qIndex + 1}. {question.question}
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={lessonAnswers[lesson.id]?.[question.id] || ''}
                  onChange={(e) => handleAnswerChange(lesson.id, question.id, parseInt(e.target.value))}
                >
                  {question.options.map((option, oIndex) => (
                    <FormControlLabel
                      key={oIndex}
                      value={oIndex}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          ))}
        </Box>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => completeLesson(lesson.id)}
          disabled={lesson.questions && lesson.questions.length > 0 && 
            (!lessonAnswers[lesson.id] || 
             Object.keys(lessonAnswers[lesson.id] || {}).length < lesson.questions.length)}
        >
          Complete Lesson
        </Button>
      </Box>
    </Paper>
  );

  const renderModuleDialog = () => (
    <Dialog
      open={!!selectedModule}
      onClose={() => setSelectedModule(null)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {getModuleIcon(selectedModule?.id)}
          </Avatar>
          <Typography variant="h6">{selectedModule?.title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedModule && (
          <Stepper activeStep={activeLesson} orientation="vertical">
            {selectedModule.lessons.map((lesson, index) => (
              <Step key={lesson.id}>
                <StepLabel>{lesson.title}</StepLabel>
                <StepContent>
                  {index === activeLesson && renderLessonContent(lesson)}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSelectedModule(null)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const renderPhishingSimulation = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'error.main' }}>
            <PhishingIcon />
          </Avatar>
          <Typography variant="h6">Phishing Simulation</Typography>
        </Box>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Test your ability to identify phishing attempts with realistic simulations.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => startPhishingSimulation('beginner')}
            disabled={simulationLoading}
            startIcon={simulationLoading ? <CircularProgress size={16} /> : <PlayIcon />}
          >
            Beginner
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => startPhishingSimulation('intermediate')}
            disabled={simulationLoading}
            startIcon={simulationLoading ? <CircularProgress size={16} /> : <PlayIcon />}
          >
            Intermediate
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => startPhishingSimulation('advanced')}
            disabled={simulationLoading}
            startIcon={simulationLoading ? <CircularProgress size={16} /> : <PlayIcon />}
          >
            Advanced
          </Button>
        </Box>

        {phishingSimulation && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Simulation started! Check your email for the phishing test.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderProgressOverview = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Your Progress
        </Typography>
        
        {progress && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {progress.overallProgress?.completionPercentage || 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Overall Completion
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {progress.overallProgress?.overallScore || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Average Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {progress.overallProgress?.completedModules || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Modules Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {progress.overallProgress?.totalTimeSpent || 0}m
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Time Spent
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Security Training
      </Typography>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Training Modules" icon={<SchoolIcon />} />
        <Tab label="Phishing Simulation" icon={<PhishingIcon />} />
        <Tab label="Achievements" icon={<TrophyIcon />} />
      </Tabs>

      {tabValue === 0 && (
        <>
          {renderProgressOverview()}
          
          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Available Training Modules
          </Typography>
          
          <Grid container spacing={3}>
            {modules.map(module => (
              <Grid item xs={12} md={6} lg={4} key={module.id}>
                {renderModuleCard(module)}
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {tabValue === 1 && renderPhishingSimulation()}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CertificateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Achievements & Certificates
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Complete training modules to earn achievements and certifications.
            </Typography>
            
            {progress?.achievements && progress.achievements.length > 0 ? (
              <List>
                {progress.achievements.map((achievement, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TrophyIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={achievement.title}
                      secondary={achievement.description}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Complete training modules to start earning achievements!
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {renderModuleDialog()}
    </Box>
  );
};

export default SecurityTraining;