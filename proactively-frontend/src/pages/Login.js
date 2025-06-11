import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Card, CardContent, Avatar, Fade } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import api from '../api/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Fade in>
        <Card sx={{ minWidth: 350, maxWidth: 400, p: 3, boxShadow: 6 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                <LockOutlinedIcon fontSize="large" />
              </Avatar>
              <Typography component="h1" variant="h4" color="primary" fontWeight={700}>
                Proactively Forms
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                Sign in to your account
              </Typography>
            </Box>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                fullWidth
                margin="normal"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3, mb: 1, fontWeight: 700, fontSize: 18 }}
              >
                Login
              </Button>
            </form>
            <Button
              onClick={() => window.location.href = '/register'}
              fullWidth
              sx={{ mt: 1, color: 'primary.main', fontWeight: 600 }}
            >
              Create an account
            </Button>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
} 