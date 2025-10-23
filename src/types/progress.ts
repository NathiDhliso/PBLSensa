/**
 * Progress Types
 * 
 * Type definitions for progress tracking and dashboard
 */

export interface UserProgress {
    userId: string;
    overallCompletion: number; // 0-100
    totalStudyTime: number; // minutes
    conceptsLearned: number;
    chaptersCompleted: number;
    coursesCompleted: number;
    lastActivityAt: string;
    updatedAt: string;
}

export interface ChapterProgress {
    chapterId: string;
    chapterName: string;
    courseId: string;
    courseName: string;
    completed: boolean;
    completedAt?: string;
    complexity: 'High' | 'Medium' | 'Low';
    analogiesViewed: number;
    totalAnalogies: number;
    timeSpent: number; // minutes
    lastViewedAt: string;
}

export interface LearningStats {
    totalStudyTime: number; // minutes
    conceptsLearned: number;
    analogiesRated: number;
    feedbackProvided: number;
}

export interface ProgressData {
    overallCompletion: number; // 0-100
    chapters: ChapterProgress[];
    stats: LearningStats;
}

export interface UpdateProgressRequest {
    chapterId?: string;
    activityType: 'chapter_complete' | 'analogy_viewed' | 'concept_reviewed';
    timeSpent?: number;
}
