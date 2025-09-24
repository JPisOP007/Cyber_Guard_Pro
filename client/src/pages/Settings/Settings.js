import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, RadioGroup, FormControlLabel, Radio, FormGroup, Switch, TextField, Button, Snackbar, Alert } from '@mui/material';
import { userAPI } from '../../services/api';

export default function Settings() {
  const [prefs, setPrefs] = useState({ theme:'system', notifications:{ email:true, push:false }, newsletter:false });
  const [pwd, setPwd] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open:false, msg:'', type:'success' });

  useEffect(() => {
    (async () => {
      try {
        const res = await userAPI.getProfile();
        const me = res?.data?.data || res?.data || {};
        setPrefs({
          theme: me?.preferences?.theme || 'system',
          notifications: me?.preferences?.notifications || { email:true, push:false },
          newsletter: !!me?.preferences?.newsletter,
        });
      } catch (e) {
        setToast({ open:true, msg: e?.response?.data?.message || e.message || 'Failed to load settings', type:'error' });
      } finally { setLoading(false); }
    })();
  }, []);

  const savePrefs = async () => {
    setSaving(true);
    try {
      await userAPI.updateNotificationSettings({ ...prefs });
      setToast({ open:true, msg:'Settings saved', type:'success' });
    } catch (e) {
      setToast({ open:true, msg: e?.response?.data?.message || e.message || 'Failed to save', type:'error' });
    } finally { setSaving(false); }
  };

  // Broadcast theme changes so the app can re-theme immediately (mode only)
  const applyTheme = (next) => {
    let mode = next || prefs.theme || 'system';
    if (mode === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      mode = prefersDark ? 'dark' : 'light';
    }
    const detail = { mode };
    try { localStorage.setItem('theme-preference', JSON.stringify(detail)); } catch (_) {}
    window.dispatchEvent(new CustomEvent('theme-change', { detail }));
  };

  const onChangePwd = async () => {
    if (!pwd.currentPassword || !pwd.newPassword || pwd.newPassword !== pwd.confirm) {
      setToast({ open:true, msg:'Please fill all password fields and ensure they match', type:'warning' });
      return;
    }
    try {
      await userAPI.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setPwd({ currentPassword:'', newPassword:'', confirm:'' });
      setToast({ open:true, msg:'Password changed', type:'success' });
    } catch (e) {
      setToast({ open:true, msg: e?.response?.data?.message || e.message || 'Password change failed', type:'error' });
    }
  };

  return (
    <Box sx={{ display:'grid', gap:3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Settings
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Fine-tune the fryer: set preferences to keep your potato fortress crispy and safe.
      </Typography>

      <Paper sx={{ p:3 }}>
        <Typography variant="h6">Appearance</Typography>
        <RadioGroup
          row
          value={prefs.theme}
          onChange={(e)=>{
            const value = e.target.value;
            setPrefs(p=>({ ...p, theme: value }));
            applyTheme(value);
          }}
        >
          <FormControlLabel value="system" control={<Radio />} label="System" />
          <FormControlLabel value="light" control={<Radio />} label="Light" />
          <FormControlLabel value="dark" control={<Radio />} label="Dark" />
          {/* Potato variant removed */}
        </RadioGroup>
        <Button variant="contained" disabled={saving || loading} onClick={async ()=>{ await savePrefs(); applyTheme(); }}>Save</Button>
      </Paper>

      <Paper sx={{ p:3 }}>
        <Typography variant="h6">Notifications</Typography>
        <FormGroup>
          <FormControlLabel control={<Switch checked={!!prefs.notifications?.email} onChange={(e)=>setPrefs(p=>({ ...p, notifications:{ ...p.notifications, email:e.target.checked } }))} />} label="Email alerts" />
          <FormControlLabel control={<Switch checked={!!prefs.notifications?.push} onChange={(e)=>setPrefs(p=>({ ...p, notifications:{ ...p.notifications, push:e.target.checked } }))} />} label="Push notifications" />
          <FormControlLabel control={<Switch checked={!!prefs.newsletter} onChange={(e)=>setPrefs(p=>({ ...p, newsletter:e.target.checked }))} />} label="Product newsletter" />
        </FormGroup>
        <Button variant="contained" disabled={saving || loading} onClick={savePrefs}>Save</Button>
      </Paper>

      <Paper sx={{ p:3, maxWidth: 460 }}>
        <Typography variant="h6">Change Password</Typography>
        <Box sx={{ display:'grid', gap:2, mt:1 }}>
          <TextField type="password" label="Current password" value={pwd.currentPassword} onChange={(e)=>setPwd(s=>({ ...s, currentPassword:e.target.value }))} />
          <TextField type="password" label="New password" value={pwd.newPassword} onChange={(e)=>setPwd(s=>({ ...s, newPassword:e.target.value }))} />
          <TextField type="password" label="Confirm new password" value={pwd.confirm} onChange={(e)=>setPwd(s=>({ ...s, confirm:e.target.value }))} />
          <Button variant="contained" onClick={onChangePwd}>Update password</Button>
        </Box>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={()=>setToast(s=>({ ...s, open:false }))}>
        <Alert severity={toast.type} sx={{ width: '100%' }}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
}