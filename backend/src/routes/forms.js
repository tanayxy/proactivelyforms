const express = require('express');
const router = express.Router();
const Form = require('../models/Form');
const { auth, adminOnly } = require('../middleware/auth');

// Create a new form (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, fields } = req.body;
    const form = await Form.createForm({
      title,
      description,
      created_by: req.user.id
    });

    // Create form fields
    if (fields && fields.length > 0) {
      for (const field of fields) {
        let options = null;
        if (field.type === 'dropdown' && field.options) {
          options = JSON.stringify(field.options);
        }
        await Form.pool.query(
          `INSERT INTO form_fields (form_id, field_type, label, required, options, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [form.id, field.type, field.label, field.required, options, field.order_index]
        );
      }
    }

    const completeForm = await Form.getFormWithFields(form.id);
    res.status(201).json(completeForm);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all forms created by the user
router.get('/my-forms', auth, async (req, res) => {
  try {
    const forms = await Form.findAll({ created_by: req.user.id });
    res.json(forms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a specific form
router.get('/:id', auth, async (req, res) => {
  try {
    const form = await Form.getFormWithFields(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join a form using share code
router.post('/join/:shareCode', auth, async (req, res) => {
  try {
    const form = await Form.findByShareCode(req.params.shareCode);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    await Form.addParticipant(form.id, req.user.id);
    const completeForm = await Form.getFormWithFields(form.id);
    res.json(completeForm);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get form participants
router.get('/:id/participants', auth, async (req, res) => {
  try {
    const participants = await Form.getParticipants(req.params.id);
    res.json(participants);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update form response
router.post('/:id/response', auth, async (req, res) => {
  try {
    const { fieldId, value } = req.body;
    const formId = req.params.id;

    // Check if response exists
    let response = await Form.getFormResponse(formId);
    
    if (!response) {
      // Create new response
      response = await Form.pool.query(
        `INSERT INTO form_responses (form_id, field_values, last_updated_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [formId, { [fieldId]: value }, req.user.id]
      );
    } else {
      // Update existing response
      response = await Form.pool.query(
        `UPDATE form_responses 
         SET field_values = field_values || $1::jsonb,
             last_updated_by = $2,
             last_updated_at = CURRENT_TIMESTAMP
         WHERE form_id = $3
         RETURNING *`,
        [{ [fieldId]: value }, req.user.id, formId]
      );
    }

    res.json(response.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get form response
router.get('/:id/response', auth, async (req, res) => {
  try {
    const response = await Form.getFormResponse(req.params.id);
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 