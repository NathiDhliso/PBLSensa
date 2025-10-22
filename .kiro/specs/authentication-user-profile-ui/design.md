# Design Document

## Overview

The Authentication & User Profile UI feature provides a complete user-facing interface for account management and personalization in the Sensa Learn platform. This design builds on the existing AuthContext, auth service, and API integration layer to deliver a seamless authentication experience with profile customization capabilities.

The system integrates with Amazon Cognito for authentication, the backend API for profile management, and follows the established Sensa Learn brand theme with purple-tinted dark mode support. The design prioritizes accessibility, responsive layouts, and smooth user experiences across all devices.

### Design Philosophy

1. **Progressive Disclosure**: Guide users through registration and profile setup without overwhelming them
2. **Immediate Feedback**: Provide real-time validation and clear error messages
3. **Accessibility First**: WCAG AAA compliance with keyboard navigation and screen reader support
4. **Mobile-First**: Responsive design that works seamlessly on all screen sizes
5. **Brand Consistency**: Use established brand colors, gradients, and animations throughout

### Key Design Decisions

- **React Router v6** for client-side routing with protected routes
- **React Hook Form** for performant form management with validation
- **Zod** for schema-based validation with TypeScript integration
- **Existing AuthContext** for global authentication state management
- **React Query** for profile data fetching and caching
- **Framer Motion** for page transitions and micro-interactions
- **Tailwind CSS** with brand theme for consistent styling

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Component Layer                       │
│     (Pages, Forms, Inputs, Buttons, Modals, Banners)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Routing & Navigation Layer                 │
│        (Protected Routes, Public Routes, Redirects)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layer                     │
│     (AuthContext, React Query, Form State, Local State)     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service & API Layer                        │
│        (auth.ts, sensaService.ts, API client)               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│           (Amazon Cognito, Backend API, AWS)                │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── profile/
│   │   ├── ProfilePage.tsx
│   │   └── ProfileSetupPage.tsx
│   └── DashboardPage.tsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── profile/
│   │   ├── ProfileView.tsx
│   │   ├── ProfileEditForm.tsx
│   │   └── ProfileCompletionBanner.tsx
│   ├── routing/
│   │   ├── ProtectedRoute.tsx
│   │   └── PublicRoute.tsx
│   └── ui/
│       ├── Input.tsx
│       ├── Button.tsx
│       ├── Select.tsx
│       ├── TagInput.tsx
│       └── FormField.tsx
├── hooks/
│   ├── useProfile.ts
│   ├── useUpdateProfile.ts
│   └── useFormValidation.ts
├── utils/
│   └── validation.ts
└── types/
    └── profile.ts
```

## Components and Interfaces

### 1. Routing Components

#### ProtectedRoute Component

**Purpose**: Wrapper component that ensures only authenticated users can access certain routes

**Interface**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}
```

**Behavior**:
- Check `isAuthenticated` from AuthContext
- If authenticated: render children
- If not authenticated: redirect to login with return URL
- Show loading spinner while checking auth state

#### PublicRoute Component

**Purpose**: Wrapper for routes that should redirect authenticated users away

**Interface**:
```typescript
interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}
```

**Behavior**:
- Check `isAuthenticated` from AuthContext
- If authenticated: redirect to dashboard
- If not authenticated: render children

### 2. Authentication Pages

#### LoginPage

**Purpose**: User login interface

**Layout**:
- Centered card on branded gradient background
- Logo and welcome message at top
- LoginForm component
- Links to register and forgot password
- Animated page transition on mount/unmount

**Responsive Behavior**:
- Desktop: 500px max-width card with padding
- Tablet: 90% width with reduced padding
- Mobile: Full width with minimal padding

#### RegisterPage

**Purpose**: New user registration interface

**Layout**:
- Similar to LoginPage but with RegisterForm
- Progress indicator (Step 1 of 2)
- Link to login page
- Success message redirects to profile setup

#### ForgotPasswordPage

**Purpose**: Password reset initiation

**Layout**:
- Simple form requesting email
- Clear instructions
- Back to login link
- Success state shows "Check your email" message

#### ResetPasswordPage

**Purpose**: Password reset completion with code

**Layout**:
- Form with code input and new password fields
- Resend code button with cooldown timer
- Success redirects to login

### 3. Authentication Forms

#### LoginForm Component

**Purpose**: Email/password login form with validation

**Interface**:
```typescript
interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
}
```

**Fields**:
1. Email (type="email", required, email validation)
2. Password (type="password", required, min 8 chars)

**Validation**:
- Real-time validation on blur
- Email format check
- Required field checks
- Display inline errors below fields

**Submission Flow**:
1. Validate all fields
2. Call `signIn` from AuthContext
3. Show loading spinner on button
4. On success: redirect to dashboard or return URL
5. On error: display error toast and keep form enabled

**Accessibility**:
- Proper label associations
- ARIA error announcements
- Keyboard navigation
- Focus management


#### RegisterForm Component

**Purpose**: New user registration with email, password, and optional name

**Interface**:
```typescript
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

interface RegisterFormProps {
  onSuccess?: () => void;
}
```

**Fields**:
1. Name (optional, text input)
2. Email (required, email validation)
3. Password (required, strength validation)
4. Confirm Password (required, must match password)

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Validation**:
- Real-time password strength indicator
- Match validation for confirm password
- Email format and uniqueness check
- Visual feedback for each requirement

**Submission Flow**:
1. Validate all fields
2. Call `signUp` from AuthContext
3. Show loading state
4. On success: redirect to profile setup
5. On error: display specific error message

#### ForgotPasswordForm Component

**Purpose**: Request password reset code

**Interface**:
```typescript
interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}
```

**Fields**:
1. Email (required, email validation)

**Submission Flow**:
1. Validate email
2. Call `forgotPassword` from AuthContext
3. Show success message
4. Provide link to reset password page

#### ResetPasswordForm Component

**Purpose**: Complete password reset with code

**Interface**:
```typescript
interface ResetPasswordFormData {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}
```

**Fields**:
1. Email (pre-filled from query param or manual entry)
2. Verification Code (6-digit code)
3. New Password (same requirements as registration)
4. Confirm Password (must match)

**Additional Features**:
- Resend code button with 60-second cooldown
- Code expiration warning
- Clear error messages for invalid/expired codes

### 4. Profile Components

#### ProfilePage Component

**Purpose**: Main profile management page with view/edit modes

**State Management**:
```typescript
interface ProfilePageState {
  isEditing: boolean;
}
```

**Layout**:
- Header with user name and edit button
- ProfileView component (view mode)
- ProfileEditForm component (edit mode)
- Animated transition between modes

**Data Fetching**:
- Use `useProfile` hook to fetch profile data
- Show skeleton loaders while loading
- Display error state with retry button
- Cache profile data with React Query

#### ProfileView Component

**Purpose**: Display user profile information in read-only mode

**Interface**:
```typescript
interface ProfileViewProps {
  profile: UserProfile;
  onEdit: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  ageRange?: string;
  location?: string;
  interests?: string[];
}
```

**Layout**:
- Card-based design with sections
- Icon + label + value for each field
- "Not set" placeholder for empty fields
- Edit button at bottom

**Visual Design**:
- Use brand colors for icons
- Subtle borders between sections
- Hover effects on edit button
- Responsive grid layout

#### ProfileEditForm Component

**Purpose**: Editable form for updating profile information

**Interface**:
```typescript
interface ProfileEditFormData {
  name: string;
  ageRange: string;
  location: string;
  interests: string[];
}

interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: (data: ProfileEditFormData) => Promise<void>;
  onCancel: () => void;
}
```

**Fields**:
1. Name (text input, required)
2. Age Range (dropdown select, optional)
3. Location (text input, optional)
4. Interests (tag input with autocomplete, optional)

**Age Range Options**:
- Under 18
- 18-24
- 25-34
- 35-44
- 45-54
- 55-64
- 65+

**Interests Input**:
- Multi-select tag component
- Autocomplete suggestions from common interests
- Add custom interests
- Remove tags with X button
- Maximum 10 interests

**Submission Flow**:
1. Validate required fields
2. Call `useUpdateProfile` mutation
3. Show loading state on save button
4. On success: show toast, exit edit mode, invalidate cache
5. On error: show error toast, keep form in edit mode

#### ProfileSetupPage Component

**Purpose**: Guided profile completion for new users

**Layout**:
- Welcome message with user's name
- Explanation of personalization benefits
- ProfileEditForm with all fields
- Skip button and Save button
- Progress indicator (Step 2 of 2)

**Behavior**:
- Pre-fill name from registration if available
- Emphasize benefits of completing profile
- Allow skipping with banner reminder
- Redirect to dashboard on completion

#### ProfileCompletionBanner Component

**Purpose**: Dismissible banner prompting profile completion

**Interface**:
```typescript
interface ProfileCompletionBannerProps {
  onComplete: () => void;
  onDismiss: () => void;
}
```

**Layout**:
- Fixed position at top of dashboard
- Icon + message + action buttons
- Dismiss button (X)
- Animated slide-in on mount

**Behavior**:
- Show only if profile is incomplete
- Persist dismissal in localStorage
- Don't show again after dismissal
- Remove when profile is completed

### 5. UI Components

#### Input Component

**Purpose**: Reusable text input with validation support

**Interface**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}
```

**Features**:
- Label with required indicator
- Error message display
- Helper text for guidance
- Focus and error states
- Accessible markup

#### Button Component

**Purpose**: Reusable button with loading and variant support

**Interface**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Variants**:
- Primary: gradient background, white text
- Secondary: solid color, white text
- Outline: border only, colored text
- Ghost: no background, colored text

**States**:
- Default, hover, active, disabled, loading
- Loading shows spinner and disables interaction
- Smooth transitions between states

#### Select Component

**Purpose**: Dropdown select with custom styling

**Interface**:
```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  placeholder?: string;
}
```

**Features**:
- Custom arrow icon
- Styled dropdown
- Keyboard navigation
- Error state styling

#### TagInput Component

**Purpose**: Multi-select input with tag display and autocomplete

**Interface**:
```typescript
interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
}
```

**Features**:
- Display selected tags as chips
- Remove tag with X button
- Autocomplete dropdown
- Add custom tags
- Maximum tag limit
- Keyboard navigation (Enter to add, Backspace to remove)

#### FormField Component

**Purpose**: Wrapper component for consistent form field layout

**Interface**:
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
}
```

**Layout**:
- Label at top
- Input/select/custom component
- Helper text below
- Error message (replaces helper text)
- Consistent spacing

## Data Models

### User Profile Model

```typescript
interface UserProfile {
  userId: string;
  email: string;
  name: string;
  ageRange?: 'Under 18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  location?: string;
  interests?: string[];
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfileRequest {
  name?: string;
  ageRange?: string;
  location?: string;
  interests?: string[];
}

interface UpdateProfileResponse {
  profile: UserProfile;
  message: string;
}
```

### Form Validation Schemas

```typescript
// Login validation
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Registration validation
const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Profile update validation
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ageRange: z.string().optional(),
  location: z.string().optional(),
  interests: z.array(z.string()).max(10, 'Maximum 10 interests allowed').optional(),
});
```

### Route Configuration

```typescript
interface RouteConfig {
  path: string;
  element: React.ReactNode;
  protected: boolean;
  redirectIfAuthenticated?: boolean;
}

const routes: RouteConfig[] = [
  // Public routes (redirect if authenticated)
  { path: '/login', element: <LoginPage />, protected: false, redirectIfAuthenticated: true },
  { path: '/register', element: <RegisterPage />, protected: false, redirectIfAuthenticated: true },
  { path: '/forgot-password', element: <ForgotPasswordPage />, protected: false },
  { path: '/reset-password', element: <ResetPasswordPage />, protected: false },
  
  // Protected routes
  { path: '/dashboard', element: <DashboardPage />, protected: true },
  { path: '/profile', element: <ProfilePage />, protected: true },
  { path: '/profile/setup', element: <ProfileSetupPage />, protected: true },
];
```

## Error Handling

### Authentication Errors

**Cognito Error Mapping**:
```typescript
const authErrorMessages: Record<string, string> = {
  'UserNotFoundException': 'No account found with this email',
  'NotAuthorizedException': 'Invalid email or password',
  'UserNotConfirmedException': 'Please verify your email before logging in',
  'CodeMismatchException': 'Invalid verification code',
  'ExpiredCodeException': 'Verification code has expired',
  'LimitExceededException': 'Too many attempts. Please try again later',
  'UsernameExistsException': 'An account with this email already exists',
  'InvalidPasswordException': 'Password does not meet requirements',
};

function getAuthErrorMessage(error: any): string {
  const errorCode = error.code || error.name;
  return authErrorMessages[errorCode] || 'An error occurred. Please try again.';
}
```

### Form Validation Errors

**Display Strategy**:
- Show errors inline below each field
- Highlight error fields with red border
- Display first error in toast on submit
- Focus first error field on submit
- Clear errors on field change

### Network Errors

**Handling Strategy**:
```typescript
function handleNetworkError(error: any) {
  if (error.message === 'Network Error') {
    showToast({
      type: 'error',
      message: 'Network connection lost. Please check your internet connection.',
    });
  } else if (error.response?.status === 500) {
    showToast({
      type: 'error',
      message: 'Server error. Please try again later.',
    });
  } else {
    showToast({
      type: 'error',
      message: error.message || 'An unexpected error occurred',
    });
  }
}
```

### Profile Update Errors

**Retry Strategy**:
- Show error toast with retry button
- Keep form in edit mode with data preserved
- Allow user to modify and resubmit
- Log errors for monitoring

## Testing Strategy

### Unit Tests

**Form Components**:
- Render with default props
- Display validation errors correctly
- Call onSubmit with correct data
- Handle loading states
- Disable submit during submission

**Validation Functions**:
- Accept valid inputs
- Reject invalid inputs
- Return correct error messages
- Handle edge cases

**Routing Components**:
- Redirect unauthenticated users
- Allow authenticated users
- Preserve return URL
- Handle loading states

### Integration Tests

**Authentication Flow**:
- Complete registration process
- Login with valid credentials
- Logout successfully
- Reset password flow
- Handle authentication errors

**Profile Management**:
- View profile data
- Edit and save profile
- Cancel editing
- Handle validation errors
- Update cache after save

**Protected Routes**:
- Block unauthenticated access
- Allow authenticated access
- Redirect after login
- Preserve navigation state

### E2E Tests

**User Journeys**:
1. New user registration → profile setup → dashboard
2. Existing user login → view profile → edit profile
3. Forgot password → reset password → login
4. Incomplete profile → banner → complete profile

**Accessibility Tests**:
- Keyboard navigation through forms
- Screen reader announcements
- Focus management
- ARIA attributes

### Visual Regression Tests

**Components to Test**:
- All form pages in light/dark mode
- Profile view and edit modes
- Error states
- Loading states
- Responsive layouts

## Performance Considerations

### Code Splitting

**Route-based Splitting**:
```typescript
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
```

**Benefits**:
- Reduce initial bundle size
- Load auth pages only when needed
- Faster time to interactive

### Form Performance

**React Hook Form Optimization**:
- Uncontrolled inputs for better performance
- Validation on blur instead of onChange
- Debounced async validation
- Minimal re-renders

### Data Fetching

**React Query Configuration**:
```typescript
const profileQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  retry: 2,
};
```

### Animation Performance

**Optimization Strategies**:
- Use transform and opacity only
- Leverage GPU acceleration
- Respect prefers-reduced-motion
- Limit concurrent animations

## Security Considerations

### Token Management

**Storage Strategy**:
- Store tokens in memory (AuthContext state)
- Never store in localStorage (XSS risk)
- Automatic refresh before expiry
- Clear tokens on logout

### Form Security

**Input Sanitization**:
- Validate all inputs on client and server
- Escape special characters
- Prevent XSS through React's built-in escaping
- Use parameterized queries on backend

### Password Security

**Client-side Requirements**:
- Enforce strong password rules
- Show password strength indicator
- Never log passwords
- Use type="password" for inputs

**Server-side (Cognito)**:
- Hashed storage
- Secure transmission (HTTPS)
- Rate limiting on attempts
- Account lockout after failures

### CSRF Protection

**Strategy**:
- Use Cognito's built-in CSRF protection
- Include tokens in API requests
- Validate origin headers
- Use SameSite cookies

## Accessibility Considerations

### Keyboard Navigation

**Tab Order**:
- Logical flow through forms
- Skip links for navigation
- Focus visible indicators
- No keyboard traps

**Keyboard Shortcuts**:
- Enter to submit forms
- Escape to close modals
- Arrow keys for dropdowns

### Screen Reader Support

**ARIA Labels**:
```typescript
<input
  aria-label="Email address"
  aria-describedby="email-error"
  aria-invalid={!!error}
/>
<div id="email-error" role="alert">
  {error}
</div>
```

**Live Regions**:
- Announce form errors
- Announce success messages
- Announce loading states

### Visual Accessibility

**Contrast Ratios**:
- Text: 7:1 minimum (WCAG AAA)
- Interactive elements: 4.5:1 minimum
- Error states: high contrast red
- Focus indicators: 3:1 minimum

**Font Sizes**:
- Body text: 16px minimum
- Labels: 14px minimum
- Buttons: 16px minimum
- Scalable with browser zoom

### Motion Accessibility

**Reduced Motion**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Deployment Strategy

### Environment Configuration

**Environment Variables**:
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_COGNITO_USER_POOL_ID=us-east-1_dev
VITE_COGNITO_CLIENT_ID=dev_client_id

// .env.production
VITE_API_BASE_URL=https://api.sensalearn.com
VITE_COGNITO_USER_POOL_ID=us-east-1_prod
VITE_COGNITO_CLIENT_ID=prod_client_id
```

### Build Process

**Steps**:
1. Run TypeScript type checking
2. Run linting (ESLint)
3. Run unit tests
4. Build production bundle
5. Run E2E tests
6. Deploy to staging
7. Run smoke tests
8. Deploy to production

### Rollout Plan

**Phase 1: Authentication** (Week 1)
- Deploy login and registration pages
- Test with internal users
- Monitor error rates

**Phase 2: Profile Management** (Week 2)
- Deploy profile view and edit
- Deploy profile setup flow
- Test personalization features

**Phase 3: Polish** (Week 3)
- Add animations and transitions
- Optimize performance
- Fix bugs from user feedback

### Monitoring

**Metrics to Track**:
- Registration conversion rate
- Login success rate
- Profile completion rate
- Form abandonment rate
- Error rates by type
- Page load times

**Error Tracking**:
- Authentication failures
- Form validation errors
- Network errors
- Profile update failures

## Conclusion

This design provides a comprehensive, accessible, and performant authentication and profile management system for Sensa Learn. The architecture leverages existing infrastructure (AuthContext, API layer, brand theme) while adding new UI components and user flows.

The system prioritizes user experience through progressive disclosure, immediate feedback, and clear error handling. All components are designed to be responsive, accessible, and performant across devices.

The modular component structure allows for independent development and testing, while the clear separation of concerns ensures maintainability as the application grows.
