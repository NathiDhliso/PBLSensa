/**
 * Environment Configuration and Validation
 * 
 * This module validates that all required environment variables are present
 * and provides typed access to configuration values.
 */

interface EnvConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  awsRegion: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
  enableMockApi: boolean;
  enableApiLogging: boolean;
  enableMockAuth: boolean;
}

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variables are missing
 */
function validateEnv(): void {
  const required = [
    'VITE_API_BASE_URL',
    'VITE_AWS_REGION',
    'VITE_COGNITO_USER_POOL_ID',
    'VITE_COGNITO_CLIENT_ID',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\n` +
      `Please create a .env.local file based on .env.example`
    );
  }
}

/**
 * Get environment configuration with validation
 * @returns {EnvConfig} Validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  // Validate on first access
  validateEnv();

  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    awsRegion: import.meta.env.VITE_AWS_REGION,
    cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    enableMockApi: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
    enableApiLogging: import.meta.env.VITE_ENABLE_API_LOGGING === 'true',
    enableMockAuth: import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true',
  };
}

/**
 * Check if running in development mode
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Check if running in production mode
 */
export const isProduction = import.meta.env.PROD;

// Export singleton instance
export const env = getEnvConfig();
