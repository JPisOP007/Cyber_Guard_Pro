import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

const Reports = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Reports & Analytics
      </Typography>
      
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssessmentIcon sx={{ mr: 2, color: 'info.main' }} />
            <Typography variant="h6">
              Comprehensive Security Reports
            </Typography>
          </Box>
          <Typography variant="body1" color="textSecondary">
            This page will display detailed security reports, compliance dashboards,
            trend analysis, and exportable documentation for stakeholders.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;