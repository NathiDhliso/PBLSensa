/**
 * usePasswordStrength Hook
 * 
 * Provides real-time password strength analysis for form inputs.
 * Returns strength score, feedback, and validation status.
 */

import { useMemo } from 'react';
import { calculatePasswordStrength, type PasswordStrength } from '@/utils/passwordStrength';

/**
 * Hook for calculating password strength
 * 
 * @param password - The password to analyze
 * @returns PasswordStrength object with memoized results
 * 
 * @example
 * function PasswordField() {
 *   const [password, setPassword] = useState('');
 *   const strength = usePasswordStrength(password);
 *   
 *   return (
 *     <div>
 *       <input value={password} onChange={(e) => setPassword(e.target.value)} />
 *       <div>Strength: {strength.score}/4</div>
 *       {strength.feedback.map(f => <p key={f}>{f}</p>)}
 *     </div>
 *   );
 * }
 */
export function usePasswordStrength(password: string): PasswordStrength {
  return useMemo(() => {
    return calculatePasswordStrength(password);
  }, [password]);
}
