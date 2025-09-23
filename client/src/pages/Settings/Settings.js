import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

const Settings = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Settings
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
        Tune your fryer settings: keep the oil fresh and the potatoes crisp.
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
        Fine-tune the fryer: set preferences to keep your potato fortress crispy and safe.
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