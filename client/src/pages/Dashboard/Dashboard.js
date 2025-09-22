import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  BugReport as BugReportIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Shield as ShieldIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { format, subDays } from 'date-fns';
import { useQuery } from 'react-query';

import { reportsAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useThreats } from '../../context/ThreatsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const Dashboard = () => {
  const theme = useTheme();
  const { threatAlerts, scanUpdates, connected, socket } = useSocket();
  const { recentThreats, setRecentThreats } = useThreats();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    'dashboard-report', 
    reportsAPI.getDashboardReport,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      select: (response) => response.data.data,
      onSuccess: (data) => {
        setRecentThreats(data?.recentThreats || []);
      }
    }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Listen for scan completion and threat updates to refresh dashboard
  useEffect(() => {
    if (socket) {
      const handleScanCompleted = (data) => {
        console.log('Dashboard: Scan completed, refreshing data...', data);
        refetch(); // Refresh dashboard data when scan completes
      };
      
      const handleDashboardScanUpdate = (data) => {
        console.log('Dashboard: Scan metrics update received', data);
        refetch(); // Refresh dashboard data
      };

      const handleThreatUpdate = (data) => {
        console.log('Dashboard: Threat update received', data);
        refetch(); // Refresh dashboard data for new threat counts
      };

      const handleThreatAlert = (data) => {
        console.log('Dashboard: New threat alert received', data);
        setRecentThreats(prev => [
          {
            id: data.data.id,
            title: data.data.title,
            severity: data.data.severity,
            type: data.data.type,
            createdAt: data.data.createdAt,
          },
          ...prev
        ]);
        refetch(); // Refresh dashboard to show updated threat count
      };

      socket.on('scan_completed', handleScanCompleted);
      socket.on('dashboard:scan-completed', handleDashboardScanUpdate);
      socket.on('dashboard:threat-update', handleThreatUpdate);
      socket.on('threat-alert', handleThreatAlert);

      return () => {
        socket.off('scan_completed', handleScanCompleted);
        socket.off('dashboard:scan-completed', handleDashboardScanUpdate);
        socket.off('dashboard:threat-update', handleThreatUpdate);
        socket.off('threat-alert', handleThreatAlert);
      };
    }
  }, [socket, refetch, setRecentThreats]);

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load dashboard data
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          {error.message}
        </Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  }

  // Calculate threat stats from recentThreats (real-time, not mock)
  const activeThreatsCount = recentThreats.filter(t => !t.dismissed).length;
  const criticalThreats = recentThreats.filter(t => t.severity === 'critical').length;
  const highThreats = recentThreats.filter(t => t.severity === 'high').length;
  const mediumThreats = recentThreats.filter(t => t.severity === 'medium').length;
  const lowThreats = recentThreats.filter(t => t.severity === 'low').length;

  const stats = dashboardData?.stats || {};
  const recentReports = dashboardData?.recentReports || [];
  const securityProfile = dashboardData?.securityProfile || {};

  // Only use real security score from backend, never fallback/mock
  const securityScore = securityProfile?.securityScore?.overall
    || securityProfile?.securityScore
    || stats.securityScore
    || null; // null if not available

  // Security Score Component
  const SecurityScoreCard = () => {
    // Only show score if real value exists
    if (securityScore === null || securityScore === undefined) {
      return (
        <Card>
          <CardContent>
            <Typography variant="h6">Security Score</Typography>
            <Typography variant="body2" color="textSecondary">
              No data available
            </Typography>
          </CardContent>
        </Card>
      );
    }
    const score = securityScore;
    const getScoreColor = (score) => {
      if (score >= 80) return theme.palette.success.main;
      if (score >= 60) return theme.palette.warning.main;
      return theme.palette.error.main;
    };
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ShieldIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Security Score</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                color: getScoreColor(score),
                fontWeight: 'bold' 
              }}
            >
              {score}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              out of 100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={score}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                backgroundColor: getScoreColor(score),
              },
            }}
          />
        </CardContent>
      </Card>
    );
  };

  // Threat Trend Chart - Dynamic data from dashboard
  const threatTrendData = {
    labels: Array.from({ length: 7 }, (_, i) => 
      format(subDays(new Date(), 6 - i), 'MMM dd')
    ),
    datasets: [
      {
        label: 'Threats Detected',
        data: dashboardData?.threatTrend || Array(7).fill(0),
        borderColor: theme.palette.error.main,
        backgroundColor: theme.palette.error.light,
        tension: 0.4,
      },
      {
        label: 'Vulnerabilities Found',
        data: dashboardData?.vulnerabilityTrend || Array(7).fill(0),
        borderColor: theme.palette.warning.main,
        backgroundColor: theme.palette.warning.light,
        tension: 0.4,
      },
    ],
  };

  // Vulnerability Distribution Chart
  const vulnerabilityData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [
          stats.criticalVulnerabilities || 0,
          stats.highVulnerabilities || 0,
          stats.mediumVulnerabilities || 0,
          stats.lowVulnerabilities || 0,
        ],
        backgroundColor: [
          theme.palette.error.main,
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.success.main,
        ],
      },
    ],
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Security Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: connected ? 'success.main' : 'error.main',
              }}
            />
            <Typography variant="body2" color="textSecondary">
              {connected ? 'Live Monitoring' : 'Offline'}
            </Typography>
          </Box>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Box>
      </Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
        Spud central: mash your insights, roast the risks, and keep the tubers secure.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SecurityScoreCard />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Active Threats</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {typeof activeThreatsCount === 'number' ? activeThreatsCount : 'No data'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'error.main', mr: 0.5 }} />
                <Typography variant="body2" color="textSecondary">
                  {recentThreats.length > 0 ? 'Live' : 'No data'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BugReportIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">Vulnerabilities</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'error.main' }} data-testid="vulnerability-count">
                {stats.totalVulnerabilities || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Total vulnerabilities found ({stats.criticalVulnerabilities || 0} critical)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Total Scans</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {stats.totalScans || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {stats.lastScanDate ? 
                  `Last scan: ${format(new Date(stats.lastScanDate), 'MMM dd, HH:mm')}` :
                  'No scans yet'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Trends (7 Days)
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={threatTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vulnerability Distribution
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
                <Doughnut
                  data={vulnerabilityData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Threats
              </Typography>
              {recentThreats.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                  No recent threats detected
                </Typography>
              ) : (
                <List dense>
                  {recentThreats.slice(0, 5).map((threat, index) => (
                    <ListItem key={threat.id || index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <WarningIcon 
                          color={
                            threat.severity === 'critical' ? 'error' :
                            threat.severity === 'high' ? 'warning' :
                            threat.severity === 'medium' ? 'info' : 'success'
                          }
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={threat.title}
                        secondary={format(new Date(threat.createdAt), 'MMM dd, HH:mm')}
                      />
                      <Chip
                        size="small"
                        label={threat.type}
                        color={
                          threat.severity === 'critical' ? 'error' :
                          threat.severity === 'high' ? 'warning' :
                          threat.severity === 'medium' ? 'info' : 'success'
                        }
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Scans
              </Typography>
              {recentReports.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                  No recent scans available
                </Typography>
              ) : (
                <List dense>
                  {recentReports.slice(0, 5).map((report, index) => (
                    <ListItem key={report.id || index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <BugReportIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${report.target || (report.targets && report.targets[0]) || 'Unknown Target'} - ${report.vulnerabilities?.length || 0} issues`}
                        secondary={report.createdAt && !isNaN(Date.parse(report.createdAt))
                          ? format(new Date(report.createdAt), 'MMM dd, HH:mm')
                          : 'Date unavailable'}
                      />
                      <Chip
                        size="small"
                        label={report.status}
                        color={report.status === 'completed' ? 'success' : 'info'}
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;