import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, TextField, MenuItem, Button, Snackbar, Card } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api/api';
import { initializeSocket } from '../socket';

export default function FormFiller() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [response, setResponse] = useState({});
  const [user, setUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [formResponseVersion, setFormResponseVersion] = useState(0);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await api.get(`/forms/${id}`);
        setForm(res.data);
        const resp = await api.get(`/forms/${id}/response`);
        setResponse(resp.data?.field_values || {});
        setFormResponseVersion(resp.data?.version || 0);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);

        const token = localStorage.getItem('token');
        if (token) {
          if (socketRef.current) {
            socketRef.current.disconnect();
          }
          socketRef.current = initializeSocket(token);
          socketRef.current.connect();
          socketRef.current.emit('joinForm', id);

          socketRef.current.on('formUpdated', (data) => {
            setResponse(prev => ({ ...prev, [data.fieldId]: data.value }));
            setFormResponseVersion(data.version);
          });
          socketRef.current.on('formConflict', (data) => {
            setSnackbar({ open: true, message: data.message + ' Please refresh to see the latest changes.' });
          });
          socketRef.current.on('error', (data) => {
            setSnackbar({ open: true, message: data.message });
          });
        }
      } catch (error) {
        console.error("Error fetching form or user data:", error);
        setSnackbar({ open: true, message: 'Failed to load form.' });
      }
    };
    fetchForm();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off('formUpdated');
        socketRef.current.off('formConflict');
        socketRef.current.off('error');
      }
    };
  }, [id]);

  const handleChange = (fieldId, value) => {
    setResponse(prev => ({ ...prev, [fieldId]: value }));
    if (socketRef.current) {
      socketRef.current.emit('formUpdate', { formId: id, fieldId, value, userId: user?.id, currentVersion: formResponseVersion });
    } else {
      setSnackbar({ open: true, message: "Error: Cannot send update, socket not ready." });
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/forms/${id}/submit`, { answers: response });
      setSubmitted(true);
      setSnackbar({ open: true, message: 'Form submitted successfully!' });
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to submit form.' });
    }
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