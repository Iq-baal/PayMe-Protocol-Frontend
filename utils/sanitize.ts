/**
 * Input sanitization utilities
 * Prevents XSS, injection attacks, and validates user input
 */

/**
 * Sanitize text input (narration, names, etc.)
 * Removes HTML tags and limits length
 */
export function sanitizeText(input: string, maxLength = 200): string {
  if (!input) return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize username
 * Only allows alphanumeric and underscore
 */
export function sanitizeUsername(input: string): string {
  if (!input) return '';
  
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
}

/**
 * Validate and sanitize amount
 * Ensures positive number with max 2 decimal places
 */
export function sanitizeAmount(input: string | number): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num)) {
    throw new Error('Invalid amount: not a number');
  }
  
  if (num <= 0) {
    throw new Error('Invalid amount: must be positive');
  }
  
  if (num > 1000000) {
    throw new Error('Invalid amount: exceeds maximum (1,000,000)');
  }
  
  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(input: string): string {
  if (!input) {
    throw new Error('Email is required');
  }
  
  const email = input.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  if (email.length > 254) {
    throw new Error('Email too long');
  }
  
  return email;
}

/**
 * Validate and sanitize PIN
 * Must be exactly 4 digits
 */
export function sanitizePin(input: string): string {
  if (!input) {
    throw new Error('PIN is required');
  }
  
  const pin = input.replace(/[^0-9]/g, '');
  
  if (pin.length !== 4) {
    throw new Error('PIN must be exactly 4 digits');
  }
  
  return pin;
}

/**
 * Validate verification code
 * Must be 6 digits for Cognito
 */
export function sanitizeVerificationCode(input: string): string {
  if (!input) {
    throw new Error('Verification code is required');
  }
  
  const code = input.replace(/[^0-9]/g, '');
  
  if (code.length !== 6) {
    throw new Error('Verification code must be 6 digits');
  }
  
  return code;
}

/**
 * Sanitize phone number (if needed in future)
 */
export function sanitizePhone(input: string): string {
  if (!input) return '';
  
  // Remove all non-numeric characters
  const phone = input.replace(/[^0-9+]/g, '');
  
  // Basic validation (adjust based on your requirements)
  if (phone.length < 10 || phone.length > 15) {
    throw new Error('Invalid phone number');
  }
  
  return phone;
}

/**
 * General purpose sanitizer
 * Use for any user input that doesn't have a specific sanitizer
 */
export function sanitize(input: string, maxLength = 500): string {
  if (!input) return '';
  
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, maxLength);
}

// Export all as a single object for convenience
export const Sanitize = {
  text: sanitizeText,
  username: sanitizeUsername,
  amount: sanitizeAmount,
  email: sanitizeEmail,
  pin: sanitizePin,
  code: sanitizeVerificationCode,
  phone: sanitizePhone,
  general: sanitize,
};
