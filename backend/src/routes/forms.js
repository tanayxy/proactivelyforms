const express = require('express');
const router = express.Router();
const Form = require('../models/Form');
const { auth, adminOnly } = require('../middleware/auth');
const io = require('../server').io;

// Create a new form (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, fields } = req.body;
    const form = await Form.createForm({
      title,
      description,
      created_by: req.user.id
    });

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

router.get('/my-forms', auth, async (req, res) => {
  try {
    const forms = await Form.findAll({ created_by: req.user.id });
    res.json(forms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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

router.post('/:id/response', auth, async (req, res) => {
  try {
    const { fieldId, value } = req.body;
    const formId = req.params.id;

    let response = await Form.getFormResponse(formId);
    
    if (!response) {
      response = await Form.pool.query(
        `INSERT INTO form_responses (form_id, field_values, last_updated_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [formId, { [fieldId]: value }, req.user.id]
      );
    } else {
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

router.get('/:id/response', auth, async (req, res) => {
  try {
    const response = await Form.getFormResponse(req.params.id);
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all submitted responses for a specific form (admin only)
router.get('/:id/submissions', auth, adminOnly, async (req, res) => {
  try {
    const submissions = await Form.getSubmittedResponses(req.params.id);
    res.json(submissions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit a completed form (user or admin)
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { answers } = req.body;
    const formId = req.params.id;
    const userId = req.user.id;

    if (!answers) {
      return res.status(400).json({ error: 'Answers are required for submission.' });
    }

    const submittedResponse = await Form.saveSubmittedResponse(formId, userId, answers);
    
    if (io) {
      const submissionWithEmail = await Form.getSubmittedResponseById(submittedResponse.id);
      io.to(formId).emit('formSubmitted', submissionWithEmail);
    } else {
      console.warn('Socket.IO instance not accessible in forms route for submission event.');
    }

    res.status(201).json(submittedResponse);
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(400).json({ error: error.message || 'Failed to submit form' });
  }
});

module.exports = router; 