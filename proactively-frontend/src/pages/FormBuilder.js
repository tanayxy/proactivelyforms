import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, MenuItem, List, ListItem, IconButton } from '@mui/material';
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
      <Typography variant="h4" gutterBottom>Create New Form</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Form Title"
          fullWidth
          margin="normal"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <Box sx={{ my: 2 }}>
          <Typography variant="h6">Add Field</Typography>
          <TextField
            select
            label="Type"
            value={field.type}
            onChange={e => setField({ ...field, type: e.target.value })}
            sx={{ mr: 2, width: 120 }}
          >
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="dropdown">Dropdown</MenuItem>
          </TextField>
          <TextField
            label="Label"
            value={field.label}
            onChange={e => setField({ ...field, label: e.target.value })}
            sx={{ mr: 2, width: 180 }}
          />
          <TextField
            label="Options (comma separated)"
            value={field.options}
            onChange={e => setField({ ...field, options: e.target.value })}
            sx={{ mr: 2, width: 220 }}
            disabled={field.type !== 'dropdown'}
          />
          <Button variant="outlined" onClick={addField}>Add Field</Button>
        </Box>
        <List>
          {fields.map((f, idx) => (
            <ListItem key={idx} secondaryAction={
              <IconButton edge="end" onClick={() => removeField(idx)}>
                <DeleteIcon />
              </IconButton>
            }>
              {f.label} ({f.type})
            </ListItem>
          ))}
        </List>
        {error && <Typography color="error">{error}</Typography>}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Create Form
        </Button>
      </form>
    </Container>
  );
} 