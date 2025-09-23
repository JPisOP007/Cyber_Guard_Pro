import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { useSocket } from '../../context/SocketContext';

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    text: 'Vulnerability Scanner',
    icon: <BugReportIcon />,
    path: '/vulnerability-scanner',
  },
  {
    text: 'Threat Monitor',
    icon: <WarningIcon />,
    path: '/threat-monitor',
    hasNotifications: true,
  },
  {
    text: 'Security Training',
    icon: <SchoolIcon />,
    path: '/security-training',
  },
  {
    text: 'Reports',
    icon: <AssessmentIcon />,
    path: '/reports',
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
];

const Sidebar = ({ onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { threatAlerts, scanUpdates } = useSocket();

  const handleItemClick = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  const getNotificationCount = (path) => {
    switch (path) {
      case '/threat-monitor':
        return threatAlerts.filter(alert => !alert.read).length;
      case '/vulnerability-scanner':
        return scanUpdates.filter(update => update.type === 'completed' && !update.viewed).length;
      default:
        return 0;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} data-testid="sidebar">
      {/* Logo and Title */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          CyberGuard Pro
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Cybersecurity Platform
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Proudly potato-themed 🥔
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flex: 1, py: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const notificationCount = getNotificationCount(item.path);

          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleItemClick(item.path)}
                selected={isActive}
                data-testid={`nav-${item.text.toLowerCase().replace(/\s+/g, '-')}`}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'inherit' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.95rem',
                      fontWeight: isActive ? 600 : 400,
                    },
                  }}
                />
                {notificationCount > 0 && (
                  <Chip
                    label={notificationCount}
                    size="small"
                    color="error"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      '& .MuiChip-label': {
                        px: 1,
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Status Summary */}
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Quick Status
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              Active Threats
            </Typography>
            <Chip
              label={threatAlerts.filter(alert => !alert.dismissed).length}
              size="small"
              color={threatAlerts.filter(alert => !alert.dismissed).length > 0 ? 'error' : 'success'}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              Running Scans
            </Typography>
            <Chip
              label={scanUpdates.filter(scan => scan.status === 'running').length}
              size="small"
              color="info"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;