/**
 * Mock Data for Development
 * 
 * Sample data matching production TypeScript types
 */

import {
  Course,
  Document,
  ConceptMap,
  Chapter,
  Keyword,
  Relationship,
  ProcessingStatus,
  UserProfile,
  ChapterSummary,
  AnalogyResponse,
  UploadDocumentResponse,
} from '@/types';

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Introduction to Biology',
    description: 'Fundamentals of biological sciences covering cells, genetics, and evolution',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    document_count: 3,
  },
  {
    id: 'course-2',
    name: 'Organic Chemistry',
    description: 'Study of carbon-based compounds and their reactions',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z',
    document_count: 2,
  },
  {
    id: 'course-3',
    name: 'Physics 101',
    description: 'Introduction to mechanics, thermodynamics, and electromagnetism',
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-21T00:00:00Z',
    document_count: 1,
  },
];

// Mock Documents
export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    course_id: 'course-1',
    filename: 'chapter1-cells.pdf',
    upload_date: '2025-01-01T00:00:00Z',
    processing_status: 'completed',
    sha256_hash: 'abc123def456',
    file_size: 2048000,
    mime_type: 'application/pdf',
  },
  {
    id: 'doc-2',
    course_id: 'course-1',
    filename: 'chapter2-genetics.pdf',
    upload_date: '2025-01-10T00:00:00Z',
    processing_status: 'completed',
    sha256_hash: 'def789ghi012',
    file_size: 3072000,
    mime_type: 'application/pdf',
  },
];

// Mock Keywords
const mockKeywords: Keyword[] = [
  {
    term: 'Cell',
    definition: 'The basic structural and functional unit of all living organisms',
    is_primary: true,
    exam_relevant: true,
  },
  {
    term: 'DNA',
    definition: 'Deoxyribonucleic acid, the molecule that carries genetic information',
    is_primary: true,
    exam_relevant: true,
  },
  {
    term: 'Mitochondria',
    definition: 'Organelles responsible for energy production in cells',
    is_primary: false,
    exam_relevant: true,
  },
];

// Mock Relationships
const mockRelationships: Relationship[] = [
  {
    source: 'Cell',
    target: 'DNA',
    relationship_type: 'contains',
    is_cross_chapter: false,
    strength: 0.9,
  },
  {
    source: 'Cell',
    target: 'Mitochondria',
    relationship_type: 'contains',
    is_cross_chapter: false,
    strength: 0.85,
  },
];

// Mock Chapters
const mockChapters: Chapter[] = [
  {
    chapter_number: 1,
    title: 'Introduction to Cells',
    keywords: mockKeywords,
    relationships: mockRelationships,
    exam_relevance_score: 85,
    complexity_score: 45,
  },
  {
    chapter_number: 2,
    title: 'Genetics and Heredity',
    keywords: mockKeywords.slice(1),
    relationships: mockRelationships.slice(0, 1),
    exam_relevance_score: 92,
    complexity_score: 68,
  },
];

// Mock Concept Map
export const mockConceptMap: ConceptMap = {
  course_id: 'course-1',
  chapters: mockChapters,
  global_relationships: [
    {
      source: 'DNA',
      target: 'Evolution',
      relationship_type: 'influences',
      is_cross_chapter: true,
      strength: 0.75,
    },
  ],
  generated_at: '2025-01-15T00:00:00Z',
};

// Mock Processing Status
export const mockProcessingStatus: ProcessingStatus = {
  task_id: 'task-123',
  status: 'processing',
  progress: 45,
  message: 'Extracting concepts from document...',
  cache_hit: false,
  estimated_time_remaining: 120,
  started_at: '2025-01-21T10:00:00Z',
};

// Mock User Profile
export const mockUserProfile: UserProfile = {
  user_id: 'user-123',
  age_range: '18-24',
  location: 'United States',
  interests: ['biology', 'chemistry', 'medicine', 'research'],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-20T00:00:00Z',
  learning_style: 'visual',
};

// Mock Chapter Summary
export const mockChapterSummary: ChapterSummary = {
  chapter_id: 'chapter-1',
  summary: 'This chapter introduces the fundamental unit of life: the cell. We explore cell structure, organelles, and basic cellular processes including energy production and protein synthesis.',
  key_concepts: ['Cell structure', 'Organelles', 'Cellular respiration', 'Protein synthesis'],
  complexity_score: 45,
  estimated_time: 25,
};

// Mock Analogies
export const mockAnalogies: AnalogyResponse[] = [
  {
    analogy_id: 'analogy-1',
    chapter_id: 'chapter-1',
    title: 'The Cell as a Factory',
    analogy_text: 'Think of a cell like a bustling factory. The nucleus is the control room where all the blueprints (DNA) are stored. The mitochondria are the power plants generating energy. The ribosomes are assembly lines building proteins. Just like a factory needs different departments working together, a cell needs all its organelles coordinating to keep life running smoothly.',
    learning_mantra: 'Every part has a purpose, working together for life',
    personalization_hint: 'Based on your interest in biology and visual learning style',
    generated_at: '2025-01-21T10:00:00Z',
  },
  {
    analogy_id: 'analogy-2',
    chapter_id: 'chapter-1',
    title: 'DNA as a Recipe Book',
    analogy_text: 'DNA is like a massive recipe book in the kitchen of life. Each gene is a recipe for making a specific protein. The cell reads these recipes and follows the instructions to create the proteins it needs. Just like you might make different dishes from the same cookbook, cells use different genes at different times to make what they need.',
    learning_mantra: 'Instructions for life, written in the language of genes',
    personalization_hint: 'Simplified for easier understanding',
    generated_at: '2025-01-21T10:01:00Z',
  },
];

// Mock Upload Response
export const mockUploadResponse: UploadDocumentResponse = {
  task_id: 'task-456',
  cache_hit: false,
  message: 'Document uploaded successfully. Processing started.',
};

// Helper function to add delay (simulate network latency)
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
