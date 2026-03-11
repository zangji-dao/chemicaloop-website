-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on token for faster lookups
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Create index on expires_at for cleanup
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Create index on user_id for faster user lookups
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
