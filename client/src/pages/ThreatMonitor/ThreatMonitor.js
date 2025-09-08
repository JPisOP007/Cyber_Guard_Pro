import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Badge
} from '@mui/material';
import {
  Warning as WarningIcon,
  Security as SecurityIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import webSocketService from '../../services/websocket';
import { useThreats } from '../../context/ThreatsContext';

const ThreatMonitor = () => {
  const { recentThreats, setRecentThreats } = useThreats();
  const [connectionStatus, setConnectionStatus] = React.useState({ connected: false });

  // Calculate stats from recentThreats (real-time, not mock)
  const stats = {
    total: recentThreats.length,
    critical: recentThreats.filter(t => t.severity === 'critical').length,
    high: recentThreats.filter(t => t.severity === 'high').length,
    medium: recentThreats.filter(t => t.severity === 'medium').length,
    low: recentThreats.filter(t => t.severity === 'low').length
  };

  useEffect(() => {
    // Listen for connection status changes
    const handleConnectionStatus = (status) => {
      setConnectionStatus(status);
    };

    // Listen for threat alerts
    const handleThreatAlert = (data) => {
      if (data.type === 'new-threat') {
        const newThreat = {
          ...data.data,
          timestamp: new Date(data.data.createdAt || data.data.detectedAt || Date.now())
        };
        setRecentThreats(prev => [newThreat, ...prev.slice(0, 49)]); // Keep last 50 threats
      }
    };

    // Subscribe to events
    webSocketService.on('connection-status', handleConnectionStatus);
    webSocketService.on('threat-alert', handleThreatAlert);

    // Get initial connection status
    setConnectionStatus(webSocketService.getConnectionStatus());

    // Cleanup
    return () => {
      webSocketService.off('connection-status', handleConnectionStatus);
      webSocketService.off('threat-alert', handleThreatAlert);
    };
  }, [setRecentThreats]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ErrorIcon />;
      case 'high': return <WarningIcon />;
      case 'medium': return <InfoIcon />;
      case 'low': return <SecurityIcon />;
      default: return <CircleIcon />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp || isNaN(Date.parse(timestamp))) {
      return 'Date unavailable';
    }
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Box data-testid="threat-monitor-page">
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Real-time Threat Monitor
      </Typography>

      {/* Connection Status */}
      <Alert 
        data-testid="connection-status"
        severity={connectionStatus.connected ? 'success' : 'warning'} 
        sx={{ mb: 3 }}
        icon={<CircleIcon />}
      >
        {connectionStatus.connected ? 
          'Real-time monitoring active - receiving live threat data' : 
          'Real-time monitoring offline - reconnecting...'}
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} data-testid="threat-stats">
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" data-testid="total-threats-counter">{stats.total}</Typography>
              <Typography variant="body2" color="textSecondary">Total Threats</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error" data-testid="critical-threats-counter">{stats.critical}</Typography>
              <Typography variant="body2" color="textSecondary">Critical</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" data-testid="high-threats-counter">{stats.high}</Typography>
              <Typography variant="body2" color="textSecondary">High</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" data-testid="medium-threats-counter">{stats.medium}</Typography>
              <Typography variant="body2" color="textSecondary">Medium</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" data-testid="low-threats-counter">{stats.low}</Typography>
              <Typography variant="body2" color="textSecondary">Low</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Threat Feed */}
      <Card data-testid="threat-feed">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              Live Threat Feed
            </Typography>
            <Badge 
              badgeContent={recentThreats.length} 
              color="error" 
              sx={{ ml: 2 }}
              data-testid="connection-status-badge"
            >
              <CircleIcon sx={{ color: connectionStatus.connected ? 'success.main' : 'grey.400' }} />
            </Badge>
          </Box>
          
          <Paper sx={{ maxHeight: 500, overflow: 'auto' }}>
            {recentThreats.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  {connectionStatus.connected ? 
                    'Monitoring for threats... No threats detected yet.' : 
                    'Connecting to threat monitoring system...'}
                </Typography>
              </Box>
            ) : (
              <List data-testid="threat-feed-list">
                {recentThreats.map((threat, index) => (
                  <React.Fragment key={threat._id || index}>
                    <ListItem data-testid="threat-item">
                      <ListItemIcon>
                        {getSeverityIcon(threat.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }} data-testid="threat-title">
                              {threat.title}
                            </Typography>
                            <Chip 
                              label={threat.severity?.toUpperCase()} 
                              size="small" 
                              color={getSeverityColor(threat.severity)}
                              variant="outlined"
                              data-testid="threat-severity-chip"
                            />
                            <Typography variant="caption" color="textSecondary" data-testid="threat-timestamp">
                              {formatTimestamp(threat.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }} data-testid="threat-description">
                              {threat.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip label={threat.source} size="small" variant="outlined" />
                              <Chip label={threat.type} size="small" variant="outlined" />
                              {threat.riskScore && (
                                <Chip 
                                  label={`Risk: ${threat.riskScore}`} 
                                  size="small" 
                                  color={threat.riskScore > 80 ? 'error' : 'warning'}
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentThreats.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ThreatMonitor;