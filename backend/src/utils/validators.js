const validateFormSubmission = (answers) => {
  if (!answers || typeof answers !== 'object') {
    return 'Invalid form submission format';
  }

  // Add more validation rules as needed
  // For example, checking required fields, data types, etc.
  
  return null;
};

module.exports = {
  validateFormSubmission
}; 