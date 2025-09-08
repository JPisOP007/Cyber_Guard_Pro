import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

const Settings = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Settings
      </Typography>
      
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SettingsIcon sx={{ mr: 2, color: 'action.active' }} />
            <Typography variant="h6">
              System Configuration
            </Typography>
          </Box>
          <Typography variant="body1" color="textSecondary">
            This page will provide system settings, notification preferences,
            security configurations, and account management options.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;