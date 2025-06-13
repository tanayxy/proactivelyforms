import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Card, CardContent, CircularProgress, Alert, List, ListItem, ListItemText, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import api from '../api/api';
import { initializeSocket } from '../socket';

export default function AdminFormView() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [response, setResponse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeParticipants, setActiveParticipants] = useState([]);
  const [submittedResponses, setSubmittedResponses] = useState([]);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchFormAndResponse = async () => {
      try {
        const formRes = await api.get(`/forms/${id}`);
        setForm(formRes.data);
        const responseRes = await api.get(`/forms/${id}/response`);
        setResponse(responseRes.data?.field_values || {});

        const submissionsRes = await api.get(`/forms/${id}/submissions`);
        setSubmittedResponses(submissionsRes.data);

        setLoading(false);

        const token = localStorage.getItem('token');
        if (token) {
          if (socketRef.current) {
            socketRef.current.disconnect();
          }
          socketRef.current = initializeSocket(token);
          socketRef.current.connect();
          socketRef.current.emit('joinForm', id);

          socketRef.current.on('formUpdated', (data) => {
            setResponse(prev => ({
              ...prev,
              [data.fieldId]: data.value
            }));
          });

          socketRef.current.on('activeParticipants', (participants) => {
            setActiveParticipants(participants);
          });

          socketRef.current.on('formSubmitted', (newSubmission) => {
            setSubmittedResponses(prevSubmissions => [newSubmission, ...prevSubmissions]);
          });

          socketRef.current.emit('requestParticipants', id);
        }
      } catch (err) {
        setError('Failed to fetch form data.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchFormAndResponse();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off('formUpdated');
        socketRef.current.off('activeParticipants');
        socketRef.current.off('formSubmitted');
      }
    };
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Back to Dashboard
      </Button>
      <Card sx={{ p: 3, boxShadow: 8, borderRadius: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary" fontWeight={700}>Live View: {form.title}</Typography>
        <Typography variant="subtitle1" gutterBottom color="text.secondary">{form.description}</Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" gutterBottom>Current Responses</Typography>
        <Box>
          {form.fields.map(field => (
            <Box key={field.id} sx={{ mb: 2 }}>
              <Typography variant="h6" color="text.primary">{field.label}:</Typography>
              <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
                {response[field.id] !== undefined && response[field.id] !== null ? response[field.id].toString() : 'N/A'}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>Active Participants ({activeParticipants.length})</Typography>
        {activeParticipants.length > 0 ? (
          <List>
            {activeParticipants.map(participant => (
              <ListItem key={participant.id}>
                <ListItemText primary={participant.email} secondary={`Joined at: ${new Date(participant.joinedAt).toLocaleString()}`} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">No active participants currently viewing this form.</Typography>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>Submitted Responses ({submittedResponses.length})</Typography>
        {submittedResponses.length > 0 ? (
          <List>
            {submittedResponses.map((submission) => (
              <Card key={submission.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" fontWeight={600}>Submitted by: {submission.submitted_by_email}</Typography>
                <Typography variant="body2" color="text.secondary">Submitted at: {new Date(submission.submitted_at).toLocaleString()}</Typography>
                <Box sx={{ mt: 1 }}>
                  {form.fields.map(field => (
                    <Box key={field.id} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{field.label}:</Typography>
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        {submission.answers[field.id] !== undefined && submission.answers[field.id] !== null ? submission.answers[field.id].toString() : 'N/A'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">No responses have been submitted yet.</Typography>
        )}

      </Card>
    </Container>
  );
} 