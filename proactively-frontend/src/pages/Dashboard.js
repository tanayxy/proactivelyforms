import React, { useEffect, useState } from 'react';
import { Button, Container, Typography, Box, TextField, Card, CardActionArea, CardContent, Divider, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Dashboard() {
  const [forms, setForms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        if (res.data.role === 'admin') {
          const formsRes = await api.get('/forms/my-forms');
          setForms(formsRes.data);
        } else {
          setForms([]);
        }
      } catch (error) {
        console.error("Error fetching user in Dashboard:", error);
      }
    };
    fetchUser();
  }, []);

  const handleCreate = () => {
    navigate('/form/new');
  };

  const handleJoin = async () => {
    setError('');
    try {
      const res = await api.post(`/forms/join/${joinCode}`);
      setForms((prev) => [...prev, res.data]);
      setJoinCode('');
    } catch (err) {
      setError(err.response?.data?.error || 'Join failed');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom color="primary" fontWeight={700}>Dashboard</Typography>
      {user && user.role === 'admin' && (
        <Button variant="contained" onClick={handleCreate} sx={{ mb: 2, fontWeight: 700 }}>
          + Create New Form
        </Button>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Join Form by Code"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          sx={{ mr: 2, width: 250 }}
        />
        <Button variant="outlined" onClick={handleJoin} sx={{ fontWeight: 700 }}>Join</Button>
      </Box>
      {error && <Typography color="error">{error}</Typography>}
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 2 }}>Your Forms</Typography>
      <Grid container spacing={3}>
        {forms.map(form => (
          <Grid item xs={12} sm={6} md={4} key={form.id}>
            <Card sx={{ borderRadius: 4, boxShadow: 6, transition: 'box-shadow 0.2s, transform 0.2s' }}>
              <CardActionArea 
                onClick={() => {
                  if (user && user.role === 'admin') {
                    navigate(`/admin/forms/${form.id}/live`);
                  } else {
                    navigate(`/form/${form.id}`);
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h6" color="primary" fontWeight={700}>{form.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {form.share_code ? `Share Code: ${form.share_code}` : ''}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        {forms.length === 0 && <Typography sx={{ ml: 2 }}>No forms yet.</Typography>}
      </Grid>
    </Container>
  );
} 