import bcrypt from 'bcryptjs';

/**
 * Verify a password against the stored hash
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.EDITOR_PASSWORD_HASH;

  if (!hash) {
    console.error('EDITOR_PASSWORD_HASH environment variable is not set');
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generate a password hash (for setup/testing)
 * Usage: node -e "require('./src/lib/auth').generatePasswordHash('your-password')"
 */
export async function generatePasswordHash(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Example usage in Node REPL:
// const bcrypt = require('bcryptjs');
// bcrypt.hash('mypassword', 10).then(console.log);
