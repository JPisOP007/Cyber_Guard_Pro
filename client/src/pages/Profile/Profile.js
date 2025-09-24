import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Avatar, TextField, Snackbar, Alert, Button } from '@mui/material';
import { userAPI } from '../../services/api';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open:false, msg:'', type:'success' });
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  profile: { company:'', jobTitle:'', phone:'', timezone:'UTC', bio:'' },
    subscription: { plan: 'free', status: 'active' }
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getProfile();
      const me = res?.data?.data || res?.data || {};
      setData({
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        email: me.email || '',
        subscription: me.subscription || { plan:'free', status:'active' },
  profile: { company: me.profile?.company || '', jobTitle: me.profile?.jobTitle || '', phone: me.profile?.phone || '', timezone: me.profile?.timezone || 'UTC', bio: me.profile?.bio || '' }
      });
    } catch (e) {
      setToast({ open:true, msg: e?.response?.data?.message || e.message || 'Failed to load profile', type:'error' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onField = (path) => (e) => {
    const value = e.target.value;
    setData((d) => {
      if (path.startsWith('profile.')) {
        const key = path.split('.')[1];
        return { ...d, profile: { ...d.profile, [key]: value } };
      }
      return { ...d, [path]: value };
    });
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        profile: {
          company: data.profile.company,
          jobTitle: data.profile.jobTitle,
          phone: data.profile.phone,
          timezone: data.profile.timezone,
        }
      });
      setToast({ open:true, msg:'Profile updated', type:'success' });
      await load();
    } catch (e) {
      setToast({ open:true, msg: e?.response?.data?.message || e.message || 'Failed to save', type:'error' });
    } finally { setSaving(false); }
  };

  // Avatar uploads disabled by request – using initials-only avatar

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Profile
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
        Customize your spud identity—preferences and seasoning.
      </Typography>

      <Paper sx={{ p:3, mb:3 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:2, mb:2 }}>
          <Avatar sx={{ width: 72, height:72 }}>
            {data.firstName?.[0]?.toUpperCase() || data.email?.[0]?.toUpperCase() || 'U'}
          </Avatar>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="First name" value={data.firstName} onChange={onField('firstName')} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Last name"  value={data.lastName}  onChange={onField('lastName')} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Company"    value={data.profile.company}   onChange={onField('profile.company')} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Job Title"  value={data.profile.jobTitle}  onChange={onField('profile.jobTitle')} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Phone"      value={data.profile.phone}     onChange={onField('profile.phone')} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Timezone"   value={data.profile.timezone}  onChange={onField('profile.timezone')} /></Grid>
        </Grid>

        <Box sx={{ mt:2, display:'flex', gap:2 }}>
          <Button disabled={saving || loading} variant="contained" onClick={onSave}>Save changes</Button>
          <Button disabled={loading} variant="outlined" onClick={load}>Reset</Button>
        </Box>
      </Paper>

      <Paper sx={{ p:3 }}>
        <Typography variant="subtitle1" gutterBottom>Subscription</Typography>
        <Typography variant="body2" color="text.secondary">
          Plan: <b>{data.subscription?.plan || 'free'}</b> • Status: <b>{data.subscription?.status || 'active'}</b>
        </Typography>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={()=>setToast(s=>({ ...s, open:false }))}>
        <Alert severity={toast.type} sx={{ width: '100%' }}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
}