const BaseModel = require('./BaseModel');

class FormResponse extends BaseModel {
  constructor() {
    super('form_user_submissions');
  }

  async createSubmission(formId, userId, answers) {
    const query = `
      INSERT INTO form_user_submissions (form_id, user_id, answers)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.pool.query(query, [formId, userId, answers]);
    return result.rows[0];
  }

  async getSubmissionsByForm(formId) {
    const query = `
      SELECT 
        fus.*,
        u.email as user_email,
        u.role as user_role
      FROM form_user_submissions fus
      JOIN users u ON fus.user_id = u.id
      WHERE fus.form_id = $1
      ORDER BY fus.submitted_at DESC
    `;
    const result = await this.pool.query(query, [formId]);
    return result.rows;
  }

  async getSubmissionById(submissionId) {
    const query = `
      SELECT 
        fus.*,
        u.email as user_email,
        u.role as user_role
      FROM form_user_submissions fus
      JOIN users u ON fus.user_id = u.id
      WHERE fus.id = $1
    `;
    const result = await this.pool.query(query, [submissionId]);
    return result.rows[0];
  }

  async updateSubmission(submissionId, answers) {
    const query = `
      UPDATE form_user_submissions
      SET answers = $1, submitted_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [answers, submissionId]);
    return result.rows[0];
  }

  async getActiveSubmissions(formId) {
    const query = `
      SELECT 
        fus.*,
        u.email as user_email,
        u.role as user_role
      FROM form_user_submissions fus
      JOIN users u ON fus.user_id = u.id
      WHERE fus.form_id = $1
      AND fus.submitted_at > NOW() - INTERVAL '5 minutes'
      ORDER BY fus.submitted_at DESC
    `;
    const result = await this.pool.query(query, [formId]);
    return result.rows;
  }
}

module.exports = new FormResponse(); 