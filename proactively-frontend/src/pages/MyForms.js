import React, { useEffect, useState } from 'react';
import { Container, Typography, Card, CardActionArea, CardContent, Divider, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function MyForms() {
  const [forms, setForms] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFormsAndUserRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No token found in localStorage for MyForms. Skipping API calls.");
        return;
      }

      try {
        const userRes = await api.get('/auth/me');
        console.log("User role from API:", userRes.data.role);
        setUserRole(userRes.data.role);

        if (userRes.data.role === 'admin') {
          const formsRes = await api.get('/forms/my-forms');
          setForms(formsRes.data);
        } else {
          // For users, show forms they joined (this part is not fully implemented in backend yet, so currently it will be empty)
          setForms([]);
        }
      } catch (error) {
        console.error("Error fetching user role or forms:", error);
        // Handle error, e.g., redirect to login or show an error message
      }
    };
    fetchFormsAndUserRole();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom color="primary" fontWeight={700}>My Forms</Typography>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={3}>
        {forms.map(form => (
          <Grid item xs={12} sm={6} md={4} key={form.id}>
            <Card sx={{ borderRadius: 4, boxShadow: 6, transition: 'box-shadow 0.2s, transform 0.2s' }}>
              <CardActionArea 
                onClick={() => {
                  if (userRole === 'admin') {
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