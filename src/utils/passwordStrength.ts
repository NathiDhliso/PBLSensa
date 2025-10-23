/**
 * Password Strength Validation Utility
 * 
 * Provides comprehensive password strength analysis with detailed feedback.
 * Evaluates passwords based on length, character variety, patterns, and common weaknesses.
 */

/**
 * Password strength result
 */
export interface PasswordStrength {
  score: number; // 0-4 (0: very weak, 4: very strong)
  feedback: string[];
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

/**
 * Common weak passwords to check against
 */
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321'
];

/**
 * Common patterns to detect
 */
const PATTERNS = {
  sequential: /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i,
  repeated: /(.)\1{2,}/,
  keyboard: /(?:qwerty|asdfgh|zxcvbn)/i,
};

/**
 * Calculate password strength score and provide feedback
 * 
 * @param password - The password to analyze
 * @returns PasswordStrength object with score and feedback
 * 
 * @example
 * const strength = calculatePasswordStrength('MyP@ssw0rd123');
 * console.log(strength.score); // 3
 * console.log(strength.feedback); // ['Good password!']
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Check requirements
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  // Empty password
  if (password.length === 0) {
    return {
      score: 0,
      feedback: ['Password is required'],
      isValid: false,
      requirements,
    };
  }

  // Length scoring
  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  } else if (password.length >= 8) {
    score++;
  }

  if (password.length >= 12) {
    score++;
    feedback.push('Good length');
  }

  if (password.length >= 16) {
    score++;
  }

  // Character variety scoring
  let varietyScore = 0;
  if (requirements.hasUppercase) varietyScore++;
  if (requirements.hasLowercase) varietyScore++;
  if (requirements.hasNumber) varietyScore++;
  if (requirements.hasSpecial) varietyScore++;

  score += Math.floor(varietyScore / 2);

  // Provide feedback for missing character types
  if (!requirements.hasUppercase) {
    feedback.push('Add uppercase letters');
  }
  if (!requirements.hasLowercase) {
    feedback.push('Add lowercase letters');
  }
  if (!requirements.hasNumber) {
    feedback.push('Add numbers');
  }
  if (!requirements.hasSpecial) {
    feedback.push('Add special characters (!@#$%^&*)');
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  // Check for patterns
  if (PATTERNS.sequential.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential characters');
  }

  if (PATTERNS.repeated.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeated characters');
  }

  if (PATTERNS.keyboard.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid keyboard patterns');
  }

  // Cap score at 4
  score = Math.min(4, score);

  // Add positive feedback for strong passwords
  if (score >= 4 && feedback.length === 0) {
    feedback.push('Excellent password!');
  } else if (score === 3 && feedback.length === 0) {
    feedback.push('Strong password');
  }

  // Determine if password meets minimum requirements
  const isValid = Object.values(requirements).every(req => req);

  return {
    score,
    feedback,
    isValid,
    requirements,
  };
}

/**
 * Get password strength label
 * 
 * @param score - Password strength score (0-4)
 * @returns Human-readable strength label
 */
export function getStrengthLabel(score: number): string {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Unknown';
  }
}

/**
 * Get password strength color class
 * 
 * @param score - Password strength score (0-4)
 * @returns Tailwind color class
 */
export function getStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-orange-500';
    case 3:
      return 'bg-yellow-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
}

/**
 * Get password strength text color class
 * 
 * @param score - Password strength score (0-4)
 * @returns Tailwind text color class
 */
export function getStrengthTextColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-600 dark:text-red-400';
    case 2:
      return 'text-orange-600 dark:text-orange-400';
    case 3:
      return 'text-yellow-600 dark:text-yellow-400';
    case 4:
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Validate if password meets minimum security requirements
 * 
 * @param password - The password to validate
 * @returns True if password meets all requirements
 */
export function meetsMinimumRequirements(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/**
 * Generate password strength suggestions
 * 
 * @param password - The password to analyze
 * @returns Array of suggestions to improve password
 */
export function getPasswordSuggestions(password: string): string[] {
  const suggestions: string[] = [];
  const strength = calculatePasswordStrength(password);

  if (!strength.requirements.minLength) {
    suggestions.push('Make your password at least 8 characters long');
  }

  if (!strength.requirements.hasUppercase || !strength.requirements.hasLowercase) {
    suggestions.push('Mix uppercase and lowercase letters');
  }

  if (!strength.requirements.hasNumber) {
    suggestions.push('Include at least one number');
  }

  if (!strength.requirements.hasSpecial) {
    suggestions.push('Add special characters like !@#$%^&*');
  }

  if (password.length < 12) {
    suggestions.push('Consider using 12 or more characters for better security');
  }

  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    suggestions.push('Avoid common passwords that are easy to guess');
  }

  return suggestions;
}
