/**
 * Storage Keys Constants
 * Centralized storage key definitions to prevent typos
 */

export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_SESSION: 'user_session',
  
  // Session Management
  SESSION_LAST_ACTIVITY: 'session_last_activity',
  SESSION_WARNING_SHOWN: 'session_warning_shown',
  
  // Security Monitoring
  SECURITY_RATE_LIMITS: 'security_rate_limits',
  SECURITY_EVENTS: 'security_events',
  
  // User Preferences
  THEME: 'theme',
  LANGUAGE: 'language',
  
  // Feature Flags (for optional features)
  ENABLE_GAMIFICATION: 'enable_gamification',
  ENABLE_AUDIO_FEATURES: 'enable_audio_features',
  ENABLE_MUSIC_PLAYER: 'enable_music_player',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
