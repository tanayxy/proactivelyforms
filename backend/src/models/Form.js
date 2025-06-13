const BaseModel = require('./BaseModel');
const { v4: uuidv4 } = require('uuid');

class Form extends BaseModel {
  constructor() {
    super('forms');
  }

  async createForm(data) {
    const formData = {
      ...data,
      share_code: this.generateShareCode()
    };
    return await this.create(formData);
  }

  async getFormWithFields(formId) {
    const formQuery = `
      SELECT f.*, u.email as creator_email
      FROM forms f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.id = $1
    `;
    
    const fieldsQuery = `
      SELECT *
      FROM form_fields
      WHERE form_id = $1
      ORDER BY order_index
    `;
    
    const [formResult, fieldsResult] = await Promise.all([
      this.pool.query(formQuery, [formId]),
      this.pool.query(fieldsQuery, [formId])
    ]);
    
    const form = formResult.rows[0];
    if (!form) return null;
    
    return {
      ...form,
      fields: fieldsResult.rows
    };
  }

  async getFormResponse(formId) {
    const query = `
      SELECT fr.*, u.email as last_updated_by_email
      FROM form_responses fr
      LEFT JOIN users u ON fr.last_updated_by = u.id
      WHERE fr.form_id = $1
    `;
    
    const result = await this.pool.query(query, [formId]);
    return result.rows[0];
  }

  async addParticipant(formId, userId) {
    const query = `
      INSERT INTO form_participants (form_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (form_id, user_id) DO NOTHING
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [formId, userId]);
    return result.rows[0];
  }

  async getParticipants(formId) {
    const query = `
      SELECT u.id, u.email, u.role, fp.joined_at
      FROM form_participants fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.form_id = $1
    `;
    
    const result = await this.pool.query(query, [formId]);
    return result.rows;
  }

  generateShareCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async findByShareCode(shareCode) {
    const query = `SELECT * FROM ${this.tableName} WHERE share_code = $1`;
    const result = await this.pool.query(query, [shareCode]);
    return result.rows[0];
  }

  async getSubmittedResponses(formId) {
    const query = `
      SELECT fus.*, u.email as submitted_by_email
      FROM form_user_submissions fus
      JOIN users u ON fus.user_id = u.id
      WHERE fus.form_id = $1
      ORDER BY fus.submitted_at DESC
    `;
    const result = await this.pool.query(query, [formId]);
    return result.rows;
  }

  async saveSubmittedResponse(formId, userId, answers) {
    const query = `
      INSERT INTO form_user_submissions (form_id, user_id, answers)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.pool.query(query, [formId, userId, answers]);
    return result.rows[0];
  }

  async getSubmittedResponseById(submissionId) {
    const query = `
      SELECT fus.*, u.email as submitted_by_email
      FROM form_user_submissions fus
      JOIN users u ON fus.user_id = u.id
      WHERE fus.id = $1
    `;
    const result = await this.pool.query(query, [submissionId]);
    return result.rows[0];
  }
}

module.exports = new Form(); 