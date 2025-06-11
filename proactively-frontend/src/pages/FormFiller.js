import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, TextField, MenuItem, Button, Snackbar, Card } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api/api';
import { socket } from '../socket';

export default function FormFiller() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [response, setResponse] = useState({});
  const [user, setUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForm = async () => {
      const res = await api.get(`/forms/${id}`);
      setForm(res.data);
      const resp = await api.get(`/forms/${id}/response`);
      setResponse(resp.data?.field_values || {});
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
    };
    fetchForm();
    socket.connect();
    socket.emit('joinForm', id);
    socket.on('formUpdated', (data) => {
      setResponse(prev => ({ ...prev, [data.fieldId]: data.value }));
    });
    return () => {
      socket.disconnect();
    };
  }, [id]);

  const handleChange = async (fieldId, value) => {
    setResponse(prev => ({ ...prev, [fieldId]: value }));
    await api.post(`/forms/${id}/response`, { fieldId, value });
    socket.emit('formUpdate', { formId: id, fieldId, value, userId: user?.id });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setSnackbar({ open: true, message: 'Form submitted!' });
    // Optionally, send a flag to backend to mark as submitted
  };

  if (!form) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}
        sx={{ mb: 2 }}>
        Back to Dashboard
      </Button>
      <Card sx={{ p: 3, boxShadow: 8, borderRadius: 4 }}>
        <Typography variant="h4" gutterBottom color="primary" fontWeight={700}>{form.title}</Typography>
        <Typography variant="subtitle1" gutterBottom color="text.secondary">{form.description}</Typography>
        <Box component="form" sx={{ mt: 2 }}>
          {form.fields.map(field => (
            <Box key={field.id} sx={{ mb: 2 }}>
              {field.field_type === 'text' && (
                <TextField
                  label={field.label}
                  fullWidth
                  value={response[field.id] || ''}
                  onChange={e => handleChange(field.id, e.target.value)}
                  disabled={submitted}
                />
              )}
              {field.field_type === 'number' && (
                <TextField
                  label={field.label}
                  type="number"
                  fullWidth
                  value={response[field.id] || ''}
                  onChange={e => handleChange(field.id, e.target.value)}
                  disabled={submitted}
                />
              )}
              {field.field_type === 'dropdown' && (
                <TextField
                  select
                  label={field.label}
                  fullWidth
                  value={response[field.id] || ''}
                  onChange={e => handleChange(field.id, e.target.value)}
                  disabled={submitted}
                >
                  {(field.options || []).map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
          ))}
        </Box>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2, fontWeight: 700, fontSize: 18 }}
          onClick={handleSubmit}
          disabled={submitted}
        >
          {submitted ? 'Submitted' : 'Submit'}
        </Button>
        <Typography variant="body2" sx={{ mt: 2, color: submitted ? 'green' : 'gray' }}>
          {submitted ? 'Form submitted. Thank you!' : 'All changes are saved and synced live with other users.'}
        </Typography>
      </Card>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Container>
  );
} 