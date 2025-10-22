/**
 * Dashboard Types
 * 
 * Type definitions for the Sensa Learn Dashboard
 */

export interface DashboardStats {
  totalCourses: number;
  completedChapters: number;
  totalStudyTime: number; // in minutes
  currentStreak: number;
  lastStudyDate: string;
  averageSessionLength: number; // in minutes
}

export interface StudySession {
  date: string;
  duration: number; // in minutes
  chaptersCompleted: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  progress?: number; // 0-100 for locked badges
}

export interface ChapterRecommendation {
  chapterId: string;
  chapterTitle: string;
  courseId: string;
  courseName: string;
  complexity: 'High' | 'Medium' | 'Low';
  estimatedTime: number; // in minutes
  reason: string; // Why recommended
  relevanceScore: number; // 0-1
}

export interface RecentChapter {
  chapterId: string;
  chapterTitle: string;
  courseId: string;
  courseName: string;
  lastAccessedAt: string;
  progress: number; // 0-100
  complexity: 'High' | 'Medium' | 'Low';
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  totalChapters: number;
  completedChapters: number;
  progress: number; // 0-100
  lastAccessedAt: string;
}
