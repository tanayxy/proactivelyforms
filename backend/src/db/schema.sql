-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS form_participants;
DROP TABLE IF EXISTS form_responses;
DROP TABLE IF EXISTS form_fields;
DROP TABLE IF EXISTS forms;
DROP TABLE IF EXISTS users;

-- Create users table first (no dependencies)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create forms table (depends on users)
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    share_code VARCHAR(10) UNIQUE NOT NULL
);

-- Create form_fields table (depends on forms)
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'number', 'dropdown')),
    label VARCHAR(255) NOT NULL,
    required BOOLEAN DEFAULT false,
    options JSONB, -- For dropdown fields
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create form_responses table (depends on forms and users)
CREATE TABLE form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    field_values JSONB DEFAULT '{}',
    last_updated_by UUID REFERENCES users(id),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create form_participants table (depends on forms and users)
CREATE TABLE form_participants (
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (form_id, user_id)
);

-- Create form_user_submissions table
CREATE TABLE IF NOT EXISTS form_user_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_forms_created_by ON forms(created_by);
CREATE INDEX idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX idx_form_participants_form_id ON form_participants(form_id);
CREATE INDEX idx_form_participants_user_id ON form_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_form_user_submissions_user_id ON form_user_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_user_submissions_form_id ON form_user_submissions(form_id); 