const Form = require('../models/Form');
const FormResponse = require('../models/FormResponse');
const { validateFormSubmission } = require('../utils/validators');

class FormController {
  async submitForm(req, res) {
    try {
      const { formId } = req.params;
      const { answers } = req.body;
      const userId = req.user.id;

      // Validate form submission
      const validationError = validateFormSubmission(answers);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      // Create or update submission
      const submission = await FormResponse.createSubmission(formId, userId, answers);

      // Emit real-time update for admin
      req.app.get('io').to(`form-${formId}`).emit('formSubmission', {
        submission,
        user: {
          email: req.user.email,
          role: req.user.role
        }
      });

      res.status(201).json(submission);
    } catch (error) {
      console.error('Error submitting form:', error);
      res.status(500).json({ error: 'Failed to submit form' });
    }
  }

  async getFormSubmissions(req, res) {
    try {
      const { formId } = req.params;
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const submissions = await FormResponse.getSubmissionsByForm(formId);
      res.json(submissions);
    } catch (error) {
      console.error('Error getting form submissions:', error);
      res.status(500).json({ error: 'Failed to get form submissions' });
    }
  }

  async getActiveSubmissions(req, res) {
    try {
      const { formId } = req.params;
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const activeSubmissions = await FormResponse.getActiveSubmissions(formId);
      res.json(activeSubmissions);
    } catch (error) {
      console.error('Error getting active submissions:', error);
      res.status(500).json({ error: 'Failed to get active submissions' });
    }
  }

  async getSubmissionDetails(req, res) {
    try {
      const { submissionId } = req.params;
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const submission = await FormResponse.getSubmissionById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      res.json(submission);
    } catch (error) {
      console.error('Error getting submission details:', error);
      res.status(500).json({ error: 'Failed to get submission details' });
    }
  }
}

module.exports = new FormController(); 