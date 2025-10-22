/**
 * Mock Data Service
 * 
 * Provides realistic mock data for development and fallback when backend is unavailable
 */

import { Course, Document, ConceptMap, ProcessingStatus } from '@/types';
import { UserProfile } from '@/types/profile';

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Introduction to Biology',
    description: 'Fundamental concepts in cellular biology, genetics, and evolution',
    created_at: new Date('2024-01-15').toISOString(),
    updated_at: new Date('2024-01-20').toISOString(),
    document_count: 3,
  },
  {
    id: 'course-2',
    name: 'Organic Chemistry',
    description: 'Study of carbon-based compounds and their reactions',
    created_at: new Date('2024-01-10').toISOString(),
    updated_at: new Date('2024-01-18').toISOString(),
    document_count: 5,
  },
  {
    id: 'course-3',
    name: 'Physics 101',
    description: 'Classical mechanics, thermodynamics, and wave phenomena',
    created_at: new Date('2024-01-05').toISOString(),
    updated_at: new Date('2024-01-22').toISOString(),
    document_count: 2,
  },
];

// Mock Documents
export const mockDocuments: Record<string, Document[]> = {
  'course-1': [
    {
      id: 'doc-1',
      course_id: 'course-1',
      filename: 'Cell_Structure_Chapter1.pdf',
      upload_date: new Date('2024-01-15').toISOString(),
      processing_status: 'completed' as const,
      sha256_hash: 'abc123def456',
    },
    {
      id: 'doc-2',
      course_id: 'course-1',
      filename: 'DNA_Replication_Chapter2.pdf',
      upload_date: new Date('2024-01-18').toISOString(),
      processing_status: 'completed' as const,
      sha256_hash: 'def789ghi012',
    },
    {
      id: 'doc-3',
      course_id: 'course-1',
      filename: 'Evolution_Chapter3.pdf',
      upload_date: new Date('2024-01-20').toISOString(),
      processing_status: 'processing' as const,
      sha256_hash: 'ghi345jkl678',
    },
  ],
  'course-2': [
    {
      id: 'doc-4',
      course_id: 'course-2',
      filename: 'Alkanes_and_Alkenes.pdf',
      upload_date: new Date('2024-01-12').toISOString(),
      processing_status: 'completed' as const,
      sha256_hash: 'jkl901mno234',
    },
    {
      id: 'doc-5',
      course_id: 'course-2',
      filename: 'Functional_Groups.pdf',
      upload_date: new Date('2024-01-14').toISOString(),
      processing_status: 'completed' as const,
      sha256_hash: 'mno567pqr890',
    },
  ],
  'course-3': [
    {
      id: 'doc-6',
      course_id: 'course-3',
      filename: 'Newtons_Laws.pdf',
      upload_date: new Date('2024-01-08').toISOString(),
      processing_status: 'completed' as const,
      sha256_hash: 'pqr123stu456',
    },
  ],
};

// Mock Concept Map
export const mockConceptMap: ConceptMap = {
  course_id: 'course-1',
  chapters: [
    {
      chapter_number: 1,
      title: 'Cell Structure and Function',
      keywords: [
        {
          term: 'Cell Membrane',
          definition: 'Phospholipid bilayer that controls what enters and exits the cell',
          is_primary: true,
          exam_relevant: true,
        },
        {
          term: 'Mitochondria',
          definition: 'Powerhouse of the cell, produces ATP through cellular respiration',
          is_primary: true,
          exam_relevant: true,
        },
        {
          term: 'Nucleus',
          definition: 'Contains genetic material (DNA) and controls cell activities',
          is_primary: true,
          exam_relevant: true,
        },
      ],
      relationships: [
        {
          source: 'Cell Membrane',
          target: 'Mitochondria',
          relationship_type: 'protects',
          is_cross_chapter: false,
        },
        {
          source: 'Nucleus',
          target: 'Cell Membrane',
          relationship_type: 'regulates',
          is_cross_chapter: false,
        },
      ],
      exam_relevance_score: 0.95,
    },
    {
      chapter_number: 2,
      title: 'DNA and Genetics',
      keywords: [
        {
          term: 'DNA',
          definition: 'Deoxyribonucleic acid, carries genetic information',
          is_primary: true,
          exam_relevant: true,
        },
        {
          term: 'Gene',
          definition: 'Segment of DNA that codes for a specific protein',
          is_primary: true,
          exam_relevant: true,
        },
        {
          term: 'Chromosome',
          definition: 'Organized structure of DNA and proteins',
          is_primary: false,
          exam_relevant: true,
        },
      ],
      relationships: [
        {
          source: 'DNA',
          target: 'Gene',
          relationship_type: 'contains',
          is_cross_chapter: false,
        },
        {
          source: 'Gene',
          target: 'Chromosome',
          relationship_type: 'part_of',
          is_cross_chapter: false,
        },
      ],
      exam_relevance_score: 0.92,
    },
  ],
  global_relationships: [
    {
      source: 'Nucleus',
      target: 'DNA',
      relationship_type: 'contains',
      is_cross_chapter: true,
    },
    {
      source: 'Mitochondria',
      target: 'DNA',
      relationship_type: 'has_own',
      is_cross_chapter: true,
    },
  ],
};

// Mock User Profile
export const mockProfile: UserProfile = {
  userId: 'user-123',
  email: 'demo@sensalearn.com',
  name: 'Demo User',
  ageRange: '18-24',
  location: 'United States',
  interests: ['Science', 'Technology', 'Sports', 'Music'],
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-22').toISOString(),
};

// Mock Chapter Summaries
export const mockChapterSummaries = [
  {
    chapter_id: 'ch-1',
    summary: 'Cells are the basic units of life. They contain organelles like mitochondria (energy production), nucleus (genetic control), and cell membrane (protection and transport).',
    key_concepts: ['Cell Structure', 'Organelles', 'Cell Membrane', 'Mitochondria', 'Nucleus'],
    complexity_score: 0.6,
  },
  {
    chapter_id: 'ch-2',
    summary: 'DNA is the molecule of heredity. It contains genes that code for proteins. DNA is organized into chromosomes and replicates during cell division.',
    key_concepts: ['DNA', 'Genes', 'Chromosomes', 'Replication', 'Heredity'],
    complexity_score: 0.75,
  },
];

// Mock Analogies
export const mockAnalogies = [
  {
    analogy_id: 'analogy-1',
    chapter_id: 'ch-1',
    title: 'Cell as a City',
    analogy_text: 'Think of a cell like a city. The cell membrane is like the city walls, controlling who enters and exits. The nucleus is like city hall, where all the important decisions are made. Mitochondria are like power plants, generating energy for the whole city to function.',
    learning_mantra: 'Every city needs walls, a government, and power - just like every cell!',
    personalization_hint: 'Based on your interest in technology, think of the cell membrane as a firewall!',
  },
  {
    analogy_id: 'analogy-2',
    chapter_id: 'ch-2',
    title: 'DNA as a Recipe Book',
    analogy_text: 'DNA is like a massive recipe book for your body. Each gene is a specific recipe (like "how to make eye color protein"). Chromosomes are like chapters in the book, organizing related recipes together. When cells divide, they photocopy the entire book so both cells have all the recipes.',
    learning_mantra: 'Your DNA is your body\'s cookbook - every recipe makes you, you!',
    personalization_hint: 'If you enjoy cooking, think of genes as your favorite recipes passed down through generations!',
  },
];

// Mock Processing Status
export const mockProcessingStatus: ProcessingStatus = {
  task_id: 'task-123',
  status: 'processing',
  progress: 65,
  message: 'Extracting concepts from document...',
  cache_hit: false,
  estimated_time_remaining: 45,
};

// Helper function to simulate API delay
export const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper to get mock data with delay
export const getMockCourses = async (): Promise<Course[]> => {
  await simulateDelay();
  return mockCourses;
};

export const getMockCourse = async (courseId: string): Promise<Course | null> => {
  await simulateDelay();
  return mockCourses.find(c => c.id === courseId) || null;
};

export const getMockDocuments = async (courseId: string): Promise<Document[]> => {
  await simulateDelay();
  return mockDocuments[courseId] || [];
};

export const getMockConceptMap = async (courseId: string): Promise<ConceptMap> => {
  await simulateDelay();
  return { ...mockConceptMap, course_id: courseId };
};

export const getMockProfile = async (): Promise<UserProfile> => {
  await simulateDelay();
  return mockProfile;
};

export const getMockChapterSummaries = async (_courseId: string) => {
  await simulateDelay();
  return mockChapterSummaries;
};

export const getMockAnalogies = async (chapterId: string) => {
  await simulateDelay();
  return mockAnalogies.filter(a => a.chapter_id === chapterId);
};

export const createMockCourse = async (name: string, description: string): Promise<Course> => {
  await simulateDelay();
  const newCourse: Course = {
    id: `course-${Date.now()}`,
    name,
    description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    document_count: 0,
  };
  mockCourses.push(newCourse);
  return newCourse;
};

export const updateMockProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  await simulateDelay();
  Object.assign(mockProfile, updates, {
    updatedAt: new Date().toISOString(),
  });
  return mockProfile;
};
