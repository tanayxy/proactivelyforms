const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      email: userData.email,
      password_hash: hashedPassword,
      role: userData.role || 'user'
    };
    
    return await this.create(user);
  }

  async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    const token = this.generateToken(user);
    return { user, token };
  }

  async findByEmail(email) {
    const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
    const result = await this.pool.query(query, [email]);
    return result.rows[0];
  }

  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await this.findById(decoded.id);
      return user;
    } catch (error) {
      return null;
    }
  }

  async getUserForms(userId) {
    const query = `
      SELECT f.*, 
             (SELECT COUNT(*) FROM form_participants WHERE form_id = f.id) as participant_count
      FROM forms f
      WHERE f.created_by = $1
      ORDER BY f.created_at DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getParticipatingForms(userId) {
    const query = `
      SELECT f.*, 
             u.email as creator_email,
             (SELECT COUNT(*) FROM form_participants WHERE form_id = f.id) as participant_count
      FROM form_participants fp
      JOIN forms f ON fp.form_id = f.id
      JOIN users u ON f.created_by = u.id
      WHERE fp.user_id = $1
      ORDER BY fp.joined_at DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = new User(); 