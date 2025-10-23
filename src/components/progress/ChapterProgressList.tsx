import { ChapterProgress } from '../../types/progress';

interface ChapterProgressListProps {
  chapters: ChapterProgress[];
  onChapterClick?: (chapterId: string) => void;
}

// Simple complexity badge component
function ComplexityBadge({ complexity }: { complexity: 'High' | 'Medium' | 'Low' }) {
  const colorMap = {
    High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colorMap[complexity]}`}>
      {complexity}
    </span>
  );
}

export default function ChapterProgressList({ chapters, onChapterClick }: ChapterProgressListProps) {
  if (chapters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No chapters found. Start learning to see your progress!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chapters.map((chapter) => {
        const progressPercentage = chapter.completed 
          ? 100 
          : Math.round((chapter.analogiesViewed / chapter.totalAnalogies) * 100);

        return (
          <div
            key={chapter.chapterId}
            onClick={() => onChapterClick?.(chapter.chapterId)}
            className={`
              p-4 rounded-lg border transition-all
              ${onChapterClick ? 'cursor-pointer hover:shadow-md' : ''}
              ${chapter.completed 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }
            `}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {chapter.chapterName}
                  </h3>
                  {chapter.completed && (
                    <span className="flex-shrink-0 text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {chapter.courseName}
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <ComplexityBadge complexity={chapter.complexity} />
                  
                  {!chapter.completed && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {chapter.analogiesViewed} / {chapter.totalAnalogies} analogies viewed
                    </span>
                  )}
                  
                  {chapter.timeSpent > 0 && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {Math.round(chapter.timeSpent)} min
                    </span>
                  )}
                </div>

                {!chapter.completed && chapter.totalAnalogies > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {progressPercentage}% complete
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
