import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

const Profile = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        User Profile
      </Typography>
      
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              Personal Information & Preferences
            </Typography>
          </Box>
          <Typography variant="body1" color="textSecondary">
            This page will allow users to manage their personal information,
            subscription details, security preferences, and account settings.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;