/**
 * Sensa Learn API Service
 * Handles all API calls for the Two-View Learning System
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface UserProfile {
  user_id: string;
  background: {
    profession: string;
    education: string[];
    years_experience: number;
  };
  interests: {
    hobbies: string[];
    sports: string[];
    creative_activities: string[];
  };
  life_experiences: {
    places_lived: string[];
    places_traveled: string[];
    jobs_held: string[];
    memorable_events: string[];
  };
  learning_style: {
    preferred_metaphors: string[];
    past_successful_analogies: string[];
  };
}

export interface Question {
  id: string;
  question_text: string;
  question_type: string;
  answered: boolean;
  answer_text?: string;
}

export interface Analogy {
  id: string;
  concept_id: string;
  user_experience_text: string;
  connection_explanation?: string;
  strength: number;
  tags: string[];
  type: string;
  reusable: boolean;
  created_at: string;
}

export interface Suggestion {
  analogy_id: string;
  similarity_score: number;
  suggestion_text: string;
  source_concept: string;
  experience_text: string;
  tags: string[];
  strength: number;
}

export const sensaApi = {
  // Profile endpoints
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE}/api/sensa/users/${userId}/profile`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${API_BASE}/api/sensa/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  // Question endpoints
  async generateQuestions(conceptId: string, userId: string, maxQuestions = 3): Promise<{ questions: Question[] }> {
    const response = await fetch(`${API_BASE}/api/sensa/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept_id: conceptId, user_id: userId, max_questions: maxQuestions }),
    });
    if (!response.ok) throw new Error('Failed to generate questions');
    return response.json();
  },

  // Analogy endpoints
  async getAnalogies(params: { userId: string; documentId?: string; reusable?: boolean }): Promise<{ analogies: Analogy[] }> {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE}/api/sensa/analogies?${query}`);
    if (!response.ok) throw new Error('Failed to fetch analogies');
    return response.json();
  },

  async createAnalogy(data: {
    concept_id: string;
    user_experience_text: string;
    strength: number;
    type: string;
    reusable: boolean;
  }): Promise<Analogy> {
    const response = await fetch(`${API_BASE}/api/sensa/analogies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create analogy');
    return response.json();
  },

  async updateAnalogy(analogyId: string, updates: Partial<Analogy>): Promise<Analogy> {
    const response = await fetch(`${API_BASE}/api/sensa/analogies/${analogyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update analogy');
    return response.json();
  },

  async deleteAnalogy(analogyId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/sensa/analogies/${analogyId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete analogy');
  },

  // Suggestion endpoints
  async getSuggestions(userId: string, conceptId: string): Promise<{ suggestions: Suggestion[] }> {
    const response = await fetch(
      `${API_BASE}/api/sensa/analogies/suggest/for-concept?user_id=${userId}&concept_id=${conceptId}`
    );
    if (!response.ok) throw new Error('Failed to fetch suggestions');
    return response.json();
  },

  async applySuggestion(suggestionId: string): Promise<Analogy> {
    const response = await fetch(
      `${API_BASE}/api/sensa/analogies/suggest/${suggestionId}/apply`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('Failed to apply suggestion');
    return response.json();
  },
};
