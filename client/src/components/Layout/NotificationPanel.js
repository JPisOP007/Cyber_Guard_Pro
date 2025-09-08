import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  DeleteSweep as ClearAllIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

import { useSocket } from '../../context/SocketContext';

const getSeverityIcon = (severity) => {
  if (severity >= 8) return <ErrorIcon color="error" />;
  if (severity >= 6) return <WarningIcon color="warning" />;
  if (severity >= 4) return <InfoIcon color="info" />;
  return <CheckCircleIcon color="success" />;
};

const getSeverityColor = (severity) => {
  if (severity >= 8) return 'error';
  if (severity >= 6) return 'warning';
  if (severity >= 4) return 'info';
  return 'success';
};

const NotificationPanel = ({ open, onClose, alerts }) => {
  const { clearThreatAlerts, markThreatAsRead } = useSocket();

  const handleMarkAsRead = (alertId) => {
    markThreatAsRead(alertId);
  };

  const handleClearAll = () => {
    clearThreatAlerts();
  };

  const sortedAlerts = [...alerts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const unreadCount = alerts.filter(alert => !alert.read).length;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              Notifications
              {unreadCount > 0 && (
                <Chip
                  label={unreadCount}
                  size="small"
                  color="error"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {alerts.length > 0 && (
            <Button
              size="small"
              startIcon={<ClearAllIcon />}
              onClick={handleClearAll}
              sx={{ mt: 1 }}
            >
              Clear All
            </Button>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {alerts.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No notifications
              </Typography>
              <Typography variant="body2" color="textSecondary">
                You're all caught up! New threat alerts will appear here.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {sortedAlerts.map((alert, index) => (
                <React.Fragment key={alert.id || index}>
                  <ListItem
                    sx={{
                      py: 2,
                      backgroundColor: alert.read ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                    onClick={() => !alert.read && handleMarkAsRead(alert.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getSeverityIcon(alert.severity)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: alert.read ? 400 : 600,
                              flex: 1,
                            }}
                          >
                            {alert.title}
                          </Typography>
                          <Chip
                            label={alert.type}
                            size="small"
                            color={getSeverityColor(alert.severity)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{
                              mt: 0.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {alert.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    {!alert.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          ml: 1,
                        }}
                      />
                    )}
                  </ListItem>
                  {index < sortedAlerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {alerts.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                onClose();
                // Navigate to threat monitor page
                window.location.href = '/threat-monitor';
              }}
            >
              View All Threats
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationPanel;