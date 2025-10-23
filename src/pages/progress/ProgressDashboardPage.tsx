import { useNavigate } from 'react-router-dom';
import ProgressCircle from '../../components/progress/ProgressCircle';
import ChapterProgressList from '../../components/progress/ChapterProgressList';
import { StreakDisplay } from '../../components/progress/StreakDisplay';
import { BadgeShowcase } from '../../components/badges/BadgeShowcase';
import { useProgress } from '../../hooks/useProgress';
import { useBadges } from '../../hooks/useBadges';
import { useStreaks } from '../../hooks/useStreaks';

// Mock user ID - in production, get from auth context
const MOCK_USER_ID = 'user-1';

export default function ProgressDashboardPage() {
  const navigate = useNavigate();

  const { progressData, isLoading, error } = useProgress();
  const { badges } = useBadges(MOCK_USER_ID);
  const { streak } = useStreaks(MOCK_USER_ID);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Progress
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handleChapterClick = (chapterId: string) => {
    // Navigate to chapter detail page
    const chapter = progressData?.chapters.find(c => c.chapterId === chapterId);
    if (chapter) {
      navigate(`/sensa/courses/${chapter.courseId}/chapters/${chapterId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Learning Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your achievements and continue your learning journey
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex justify-center">
            <ProgressCircle
              percentage={progressData?.overallCompletion || 0}
              size={180}
              label="Overall Progress"
            />
          </div>

          {/* Learning Streak */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Learning Streak
            </h2>
            <div className="flex justify-center">
              <StreakDisplay 
                days={streak?.currentStreak || 0}
                longestStreak={streak?.longestStreak}
                isAtRisk={streak?.isAtRisk}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Study Time</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round((progressData?.stats.totalStudyTime || 0) / 60)}h {(progressData?.stats.totalStudyTime || 0) % 60}m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Concepts Learned</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {progressData?.stats.conceptsLearned || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Analogies Rated</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {progressData?.stats.analogiesRated || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Feedback Provided</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {progressData?.stats.feedbackProvided || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Achievements
            </h2>
            <BadgeShowcase badges={[...(badges?.earned || []), ...(badges?.locked || [])]} />
          </div>
        </div>

        {/* Chapter Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Chapter Progress
          </h2>
          <ChapterProgressList
            chapters={progressData?.chapters || []}
            onChapterClick={handleChapterClick}
          />
        </div>
      </div>
    </div>
  );
}
