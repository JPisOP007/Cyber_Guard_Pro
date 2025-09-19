import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, Select, MenuItem, InputLabel, Tabs, Tab, Avatar,
  List, ListItem, ListItemIcon, ListItemText, CircularProgress,
  Alert, Tooltip, LinearProgress, Divider, Badge, Menu,
} from '@mui/material';
import {
  Assessment as AssessmentIcon, TrendingUp as TrendingUpIcon,
  Download as DownloadIcon, Visibility as ViewIcon, 
  Security as SecurityIcon, Warning as WarningIcon,
  Error as ErrorIcon, CheckCircle as CheckIcon,
  Schedule as ScheduleIcon, Shield as ShieldIcon,
  Computer as ComputerIcon, Storage as DatabaseIcon,
  Network as NetworkIcon, MoreVert as MoreVertIcon,
  FilterList as FilterIcon, DateRange as DateRangeIcon,
  PictureAsPdf as PdfIcon, GetApp as CsvIcon,
  Refresh as RefreshIcon, Search as SearchIcon
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { reportsAPI } from '../../services/api';

const Reports = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    severity: 'all'
  });
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await reportsAPI.getDashboardReport();
      setDashboardData(response.data.data);
      setReportHistory(response.data.data.recentReports || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format = 'json') => {
    setExportLoading(true);
    try {
      const response = await reportsAPI.exportReports(type, {
        format,
        ...filters
      });
      
      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-report.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON download
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `${type}-report.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
      setAnchorEl(null);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ff5722';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return <ErrorIcon style={{ color: getSeverityColor(severity) }} />;
      case 'high': return <WarningIcon style={{ color: getSeverityColor(severity) }} />;
      case 'medium': return <WarningIcon style={{ color: getSeverityColor(severity) }} />;
      case 'low': return <CheckIcon style={{ color: getSeverityColor(severity) }} />;
      default: return <SecurityIcon />;
    }
  };

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="primary">
                  {dashboardData?.stats?.totalScans || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Scans
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <ComputerIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="error.main">
                  {dashboardData?.stats?.criticalVulnerabilities || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Critical Issues
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <ErrorIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="warning.main">
                  {dashboardData?.stats?.securityScore || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Security Score
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <ShieldIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="info.main">
                  {dashboardData?.stats?.totalThreats || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Threats
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <SecurityIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTrendCharts = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Security Trends (Last 7 Days)
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="threats" 
                    stroke="#f44336" 
                    strokeWidth={2}
                    name="Threats"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vulnerabilities" 
                    stroke="#ff9800" 
                    strokeWidth={2}
                    name="Vulnerabilities"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Severity Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Critical', value: dashboardData?.stats?.criticalVulnerabilities || 0, color: '#f44336' },
                      { name: 'High', value: dashboardData?.stats?.highVulnerabilities || 0, color: '#ff9800' },
                      { name: 'Medium', value: dashboardData?.stats?.mediumVulnerabilities || 0, color: '#ff5722' },
                      { name: 'Low', value: dashboardData?.stats?.lowVulnerabilities || 0, color: '#4caf50' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Critical', value: dashboardData?.stats?.criticalVulnerabilities || 0, color: '#f44336' },
                      { name: 'High', value: dashboardData?.stats?.highVulnerabilities || 0, color: '#ff9800' },
                      { name: 'Medium', value: dashboardData?.stats?.mediumVulnerabilities || 0, color: '#ff5722' },
                      { name: 'Low', value: dashboardData?.stats?.lowVulnerabilities || 0, color: '#4caf50' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderReportsTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Reports</Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton onClick={loadDashboardData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Options">
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => handleExport('vulnerabilities', 'json')}>
                <AssessmentIcon sx={{ mr: 1 }} />
                Export JSON
              </MenuItem>
              <MenuItem onClick={() => handleExport('vulnerabilities', 'csv')}>
                <CsvIcon sx={{ mr: 1 }} />
                Export CSV
              </MenuItem>
            </Menu>
          </Box>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Scan ID</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Vulnerabilities</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportHistory.map((report) => (
                <TableRow key={report._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {report.scanId}
                    </Typography>
                  </TableCell>
                  <TableCell>{report.target}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={report.scanType} 
                      color={report.scanType === 'full' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {report.summary?.criticalCount > 0 && (
                        <Chip 
                          size="small" 
                          label={`${report.summary.criticalCount} Critical`}
                          color="error"
                        />
                      )}
                      {report.summary?.highCount > 0 && (
                        <Chip 
                          size="small" 
                          label={`${report.summary.highCount} High`}
                          color="warning"
                        />
                      )}
                      {report.summary?.mediumCount > 0 && (
                        <Chip 
                          size="small" 
                          label={`${report.summary.mediumCount} Medium`}
                          color="info"
                        />
                      )}
                      {report.summary?.lowCount > 0 && (
                        <Chip 
                          size="small" 
                          label={`${report.summary.lowCount} Low`}
                          color="success"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={report.summary?.riskScore || 0}
                        sx={{ 
                          width: 60,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: report.summary?.riskScore > 70 ? '#f44336' : 
                                           report.summary?.riskScore > 40 ? '#ff9800' : '#4caf50'
                          }
                        }}
                      />
                      <Typography variant="body2">
                        {report.summary?.riskScore || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton onClick={() => setSelectedReport(report)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {reportHistory.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No reports available. Run vulnerability scans to generate reports.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderReportDetails = () => (
    <Dialog
      open={!!selectedReport}
      onClose={() => setSelectedReport(null)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssessmentIcon color="primary" />
          <Typography variant="h6">Report Details - {selectedReport?.scanId}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {selectedReport && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Scan Information</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Target" secondary={selectedReport.target} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Scan Type" secondary={selectedReport.scanType} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Status" secondary={selectedReport.status} />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Date" 
                      secondary={new Date(selectedReport.createdAt).toLocaleString()} 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Summary</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Total Vulnerabilities" 
                      secondary={selectedReport.summary?.totalVulnerabilities || 0} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Risk Score" 
                      secondary={`${selectedReport.summary?.riskScore || 0}/100`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Critical Issues" 
                      secondary={selectedReport.summary?.criticalCount || 0} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="High Priority" 
                      secondary={selectedReport.summary?.highCount || 0} 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Vulnerabilities</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>CVE ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>CVSS Score</TableCell>
                        <TableCell>Port</TableCell>
                        <TableCell>Service</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedReport.vulnerabilities || []).map((vuln, index) => (
                        <TableRow key={index}>
                          <TableCell>{vuln.id}</TableCell>
                          <TableCell>{vuln.name}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getSeverityIcon(vuln.severity)}
                              {vuln.severity}
                            </Box>
                          </TableCell>
                          <TableCell>{vuln.cvssScore}</TableCell>
                          <TableCell>{vuln.port}</TableCell>
                          <TableCell>{vuln.affectedService}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => handleExport('vulnerabilities', 'pdf')}
          startIcon={<PdfIcon />}
          disabled={exportLoading}
        >
          Export PDF
        </Button>
        <Button onClick={() => setSelectedReport(null)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const renderComplianceTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Compliance Status</Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="GDPR Compliance" 
                  secondary="Data protection measures in place" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="SOX Compliance" 
                  secondary="Minor issues requiring attention" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="PCI DSS" 
                  secondary="Critical vulnerabilities found" 
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Risk Assessment</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Overall Risk Level: <strong>Medium</strong>
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={65} 
                sx={{ 
                  '& .MuiLinearProgress-bar': { backgroundColor: '#ff9800' }
                }}
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              Based on recent scans, your organization has a medium risk profile. 
              Address critical vulnerabilities to improve your security posture.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const generateChartData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        threats: Math.floor(Math.random() * 20) + 5,
        vulnerabilities: Math.floor(Math.random() * 30) + 10,
      });
    }
    return data;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Reports & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={exportLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disabled={exportLoading}
        >
          Export Reports
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<AssessmentIcon />} />
        <Tab label="Trends" icon={<TrendingUpIcon />} />
        <Tab label="Compliance" icon={<ShieldIcon />} />
      </Tabs>

      {tabValue === 0 && (
        <>
          {renderStatsCards()}
          {renderReportsTable()}
        </>
      )}

      {tabValue === 1 && (
        <>
          {renderStatsCards()}
          {renderTrendCharts()}
        </>
      )}

      {tabValue === 2 && renderComplianceTab()}

      {renderReportDetails()}
    </Box>
  );
};

export default Reports;