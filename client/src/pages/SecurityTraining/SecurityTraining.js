// Clean single-implementation file. If you see duplicate imports/exports below, remove them.
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckIcon,
  Schedule as ClockIcon,
  Computer as ComputerIcon,
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
  People as PeopleIcon,
  Phishing as PhishingIcon,
  PlayArrow as PlayIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { educationAPI } from '../../services/api';

const SecurityTraining = () => {
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [lessonAnswers, setLessonAnswers] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [phishingSimulation, setPhishingSimulation] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState({ success: null, detectedFlags: [] });
  const [achievements, setAchievements] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [certsLoading, setCertsLoading] = useState(false);

  useEffect(() => { loadEducationData(); }, []);
  useEffect(() => {
    if (tabValue === 2) {
      (async () => {
        setAchievementsLoading(true);
        try { const res = await educationAPI.getAchievements(); setAchievements(res.data?.data || []); } catch (e) { console.error(e); } finally { setAchievementsLoading(false); }
      })();
    } else if (tabValue === 3) {
      (async () => {
        setCertsLoading(true);
        try { const res = await educationAPI.getCertificates(); setCertificates(res.data?.data || []); } catch (e) { console.error(e); } finally { setCertsLoading(false); }
      })();
    }
  }, [tabValue]);

  const loadEducationData = async () => {
    try {
      const [modulesRes, progressRes] = await Promise.all([educationAPI.getModules(), educationAPI.getProgress()]);
      setModules(modulesRes.data?.data || []);
      setProgress(progressRes.data?.data || null);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const getDifficultyColor = (d) => (d === 'beginner' ? 'success' : d === 'intermediate' ? 'warning' : d === 'advanced' ? 'error' : 'default');
  const getDifficultyIcon = (d) => (d === 'beginner' ? <ShieldIcon /> : <SecurityIcon />);
  const getModuleIcon = (id) => id === 'phishing-basics' ? <PhishingIcon /> : id === 'password-security' ? <LockIcon /> : id === 'social-engineering' ? <PeopleIcon /> : id === 'network-security' ? <ComputerIcon /> : id === 'incident-response' ? <AssessmentIcon /> : <SecurityIcon />;

  const startModule = async (module) => {
    try { const res = await educationAPI.getModule(module.id); setSelectedModule(res.data?.data || null); setActiveLesson(0); setLessonAnswers({}); }
    catch (e) { console.error(e); }
  };
  const completeLesson = async (lessonId) => {
    if (!selectedModule) return;
    try {
      const res = await educationAPI.completeLesson(selectedModule.id, lessonId, lessonAnswers[lessonId]);
      if (res.data?.success) { await loadEducationData(); if (activeLesson < (selectedModule.lessons?.length || 0) - 1) setActiveLesson((v) => v + 1); else setSelectedModule(null); }
    } catch (e) { console.error(e); }
  };
  const handleAnswerChange = (lessonId, questionId, answer) => setLessonAnswers((prev) => ({ ...prev, [lessonId]: { ...(prev[lessonId] || {}), [questionId]: answer } }));

  const startPhishingSimulation = async (difficulty = 'beginner') => {
    setSimulationLoading(true);
    try { const res = await educationAPI.startPhishingSimulation(difficulty); const { simulation, sessionData } = res.data?.data || {}; if (simulation) { setPhishingSimulation({ ...simulation, session: sessionData }); setSimulationResult({ success: null, detectedFlags: [] }); } }
    catch (e) { console.error(e); }
    finally { setSimulationLoading(false); }
  };
  const submitSimulation = async () => {
    if (!phishingSimulation?.id) return;
    try { await educationAPI.submitSimulationResult(phishingSimulation.id, simulationResult); alert('Simulation result submitted!'); loadEducationData(); }
    catch (e) { console.error(e); alert('Failed to submit simulation result'); }
  };

  const renderModuleCard = (module) => (
    <Card key={module.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{getModuleIcon(module.id)}</Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>{module.title}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip size="small" label={module.difficulty} color={getDifficultyColor(module.difficulty)} icon={getDifficultyIcon(module.difficulty)} />
              <Chip size="small" label={module.estimatedTime} icon={<ClockIcon />} variant="outlined" />
            </Box>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>{module.description}</Typography>
        <List dense>
          {(module.topics || []).map((t, i) => (
            <ListItem key={i} disableGutters>
              <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
              <ListItemText primary={t} />
            </ListItem>
          ))}
        </List>
      </CardContent>
      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={() => startModule(module)} startIcon={<PlayIcon />}>Start</Button>
      </Box>
    </Card>
  );

  const renderLessonStep = (lesson, idx) => (
    <Step key={lesson.id} active={idx === activeLesson} completed={idx < activeLesson}>
      <StepLabel>{lesson.title}</StepLabel>
      <StepContent>
        <Typography paragraph>{lesson.content}</Typography>
        {(lesson.questions || []).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Quick Quiz</Typography>
            {(lesson.questions || []).map((q) => (
              <FormControl key={q.id} component="fieldset" sx={{ mb: 2 }}>
                <Typography sx={{ mb: 1 }}>{q.question}</Typography>
                <RadioGroup value={lessonAnswers[lesson.id]?.[q.id] ?? ''} onChange={(e) => handleAnswerChange(lesson.id, q.id, e.target.value)}>
                  {(q.options || []).map((opt) => (<FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />))}
                </RadioGroup>
              </FormControl>
            ))}
          </Box>
        )}
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={() => completeLesson(lesson.id)} disabled={idx !== activeLesson}>Mark Lesson Complete</Button>
        </Box>
      </StepContent>
    </Step>
  );

  const renderModuleDialog = () => (
    <Dialog open={!!selectedModule} onClose={() => setSelectedModule(null)} maxWidth="md" fullWidth>
      <DialogTitle><SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />{selectedModule?.title}</DialogTitle>
      <DialogContent>
        {selectedModule ? (<>
          <Typography color="text.secondary" paragraph>{selectedModule.description}</Typography>
          <Stepper activeStep={activeLesson} orientation="vertical">
            {(selectedModule.lessons || []).map((lesson, idx) => renderLessonStep(lesson, idx))}
          </Stepper>
        </>) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSelectedModule(null)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) return (<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>);

  const completedModules = progress?.overallProgress?.completedModules || 0;
  const totalModules = modules.length || 0;
  const overallScore = progress?.overallProgress?.overallScore ?? 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Security Training</Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>Learn to spot rotten potatoes (risky patterns) and keep your fields fresh and secure.</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Overall Progress</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
              <StarIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">{overallScore}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={overallScore} />
            <Typography variant="caption" color="text.secondary">{completedModules} / {totalModules} modules complete</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Training Modules" />
              <Tab label="Phishing Simulation" />
              <Tab label="Achievements" />
              <Tab label="Certificates" />
            </Tabs>
          </Paper>
        </Grid>
      </Grid>
      {tabValue === 0 && (
        <Grid container spacing={2}>
          {modules.map((m) => (
            <Grid item xs={12} md={6} lg={4} key={m.id}>{renderModuleCard(m)}</Grid>
          ))}
          {modules.length === 0 && (<Grid item xs={12}><Alert severity="info">No training modules available yet.</Alert></Grid>)}
        </Grid>
      )}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom><PhishingIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Phishing Simulation</Typography>
            {!phishingSimulation ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">Choose difficulty:</Typography>
                <Button size="small" variant="outlined" disabled={simulationLoading} onClick={() => startPhishingSimulation('beginner')}>Beginner</Button>
                <Button size="small" variant="outlined" disabled={simulationLoading} onClick={() => startPhishingSimulation('intermediate')}>Intermediate</Button>
                <Button size="small" variant="outlined" disabled={simulationLoading} onClick={() => startPhishingSimulation('advanced')}>Advanced</Button>
                {simulationLoading && <CircularProgress size={16} />}
              </Box>
            ) : (
              <>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Simulation details</Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  {phishingSimulation.type === 'email' && (
                    <>
                      <Typography gutterBottom>{phishingSimulation.subject || 'Suspicious email'}</Typography>
                      <Typography variant="body2" color="text.secondary">From: {phishingSimulation.sender || 'unknown@spudmail.com'}</Typography>
                      <Typography variant="body2" color="text.secondary">Preview: {phishingSimulation.preview || 'Click this urgent link to verify your account.'}</Typography>
                    </>
                  )}
                  {phishingSimulation.type === 'website' && (
                    <>
                      <Typography gutterBottom>Suspicious Website</Typography>
                      <Typography variant="body2" color="text.secondary">URL: {phishingSimulation.url}</Typography>
                      <Typography variant="body2" color="text.secondary">Preview: {phishingSimulation.preview}</Typography>
                    </>
                  )}
                  {phishingSimulation.type === 'social' && (
                    <>
                      <Typography gutterBottom>Scenario: {phishingSimulation.scenario}</Typography>
                      <Typography variant="body2" color="text.secondary">Preview: {phishingSimulation.preview}</Typography>
                    </>
                  )}
                  {phishingSimulation.content && (
                    <Typography sx={{ mt: 1 }}>{phishingSimulation.content}</Typography>
                  )}
                  {phishingSimulation.tips && (
                    <Alert severity="info" sx={{ mt: 2 }}>{phishingSimulation.tips}</Alert>
                  )}
                </Paper>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Red flags you noticed</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {(phishingSimulation.flags || ['Suspicious sender', 'Urgent tone', 'Link mismatch', 'Attachment']).map((flag) => (
                    <Chip key={flag} label={flag} color={simulationResult.detectedFlags.includes(flag) ? 'warning' : 'default'} onClick={() => {
                      setSimulationResult((prev) => {
                        const has = prev.detectedFlags.includes(flag);
                        return { ...prev, detectedFlags: has ? prev.detectedFlags.filter((f) => f !== flag) : [...prev.detectedFlags, flag] };
                      });
                    }} />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button variant="contained" onClick={() => setSimulationResult((p) => ({ ...p, success: true }))} color="success">This is phishing</Button>
                  <Button variant="outlined" onClick={() => setSimulationResult((p) => ({ ...p, success: false }))} color="info">Looks legitimate</Button>
                  <Button variant="contained" onClick={submitSimulation} disabled={simulationResult.success === null}>Submit Result</Button>
                  <Button onClick={() => setPhishingSimulation(null)}>Reset</Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom><TrophyIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Achievements</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>Potato badges earned during your training journey.</Typography>
            {achievementsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
            ) : achievements && achievements.length > 0 ? (
              <List>
                {achievements.map((a, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon><VerifiedIcon color="success" /></ListItemIcon>
                    <ListItemText primary={a.title} secondary={a.description} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>Complete training modules to start earning achievements!</Alert>
            )}
          </CardContent>
        </Card>
      )}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom><VerifiedIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Certificates</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>View certificates issued for completed modules.</Typography>
            {certsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
            ) : certificates && certificates.length > 0 ? (
              <List>
                {certificates.map((c, idx) => (
                  <ListItem key={idx} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon><VerifiedIcon color="primary" /></ListItemIcon>
                    <ListItemText primary={`${c.title} (${c.score || 0}%)`} secondary={`Issued: ${c.issuedAt ? new Date(c.issuedAt).toLocaleString() : 'N/A'}`} />
                    {c.url && (<Button size="small" component="a" href={c.url} target="_blank" rel="noreferrer">View</Button>)}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No certificates yet—complete modules to earn yours.</Alert>
            )}
          </CardContent>
        </Card>
      )}
      {renderModuleDialog()}
    </Box>
  );
};

export default SecurityTraining;