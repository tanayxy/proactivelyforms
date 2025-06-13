import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, MenuItem, List, ListItem, IconButton, Card, Grid, ListItemText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function FormBuilder() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [field, setField] = useState({ type: 'text', label: '', required: false, options: '', order_index: 1 });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const addField = () => {
    if (!field.label) return setError('Field label required');
    let options = undefined;
    if (field.type === 'dropdown') {
      options = field.options.split(',').map(opt => opt.trim());
    }
    setFields([...fields, { ...field, options, order_index: fields.length + 1 }]);
    setField({ type: 'text', label: '', required: false, options: '', order_index: fields.length + 2 });
    setError('');
  };

  const removeField = (idx) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/forms', {
        title,
        description,
        fields: fields.map(f => ({ ...f, options: f.type === 'dropdown' ? f.options : undefined }))
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Form creation failed');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom color="primary" fontWeight={700}>Create New Form</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Form Title"
          fullWidth
          margin="normal"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          value={description}
          onChange={e => setDescription(e.target.value)}
          sx={{ mb: 3 }}
        />
        
        <Card sx={{ p: 3, boxShadow: 8, borderRadius: 4, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Add New Field</Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Type"
                fullWidth
                value={field.type}
                onChange={e => setField({ ...field, type: e.target.value, options: '' })}
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="dropdown">Dropdown</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Label"
                fullWidth
                value={field.label}
                onChange={e => setField({ ...field, label: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant="outlined" onClick={addField} fullWidth sx={{ py: 1.5 }}>Add Field</Button>
            </Grid>
            {field.type === 'dropdown' && (
              <Grid item xs={12}>
                <TextField
                  label="Options (comma separated)"
                  fullWidth
                  value={field.options}
                  onChange={e => setField({ ...field, options: e.target.value })}
                  helperText="Enter options separated by commas (e.g., Option A, Option B)"
                />
              </Grid>
            )}
          </Grid>
        </Card>

        <Typography variant="h6" sx={{ mb: 2 }}>Current Fields</Typography>
        <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, mb: 3 }}>
          {fields.length === 0 && <ListItem><Typography color="text.secondary">No fields added yet.</Typography></ListItem>}
          {fields.map((f, idx) => (
            <ListItem
              key={idx}
              secondaryAction={
                <IconButton edge="end" onClick={() => removeField(idx)} aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText 
                primary={f.label} 
                secondary={
                  <>
                    Type: {f.type}
                    {f.type === 'dropdown' && f.options && f.options.length > 0 && (
                      <> | Options: {f.options.join(', ')}</>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.5, fontWeight: 700, fontSize: 18 }}>
          Create Form
        </Button>
      </form>
    </Container>
  );
} 