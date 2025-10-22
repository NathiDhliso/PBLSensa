/**
 * useAuth Hook
 * 
 * Re-export of the useAuth hook from AuthContext for convenient importing.
 * 
 * @example
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * function MyComponent() {
 *   const { user, isAuthenticated, signIn, signOut } = useAuth();
 *   // ...
 * }
 */

export { useAuth } from '@/contexts/AuthContext';
export type { CognitoUser, UserAttributes } from '@/services/auth';
