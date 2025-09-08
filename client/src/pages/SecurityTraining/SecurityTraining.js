import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';

const SecurityTraining = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Security Training
      </Typography>
      
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SchoolIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              Interactive Security Education
            </Typography>
          </Box>
          <Typography variant="body1" color="textSecondary">
            This page will provide gamified security training modules, phishing simulations,
            progress tracking, and certification programs to enhance cybersecurity awareness.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecurityTraining;