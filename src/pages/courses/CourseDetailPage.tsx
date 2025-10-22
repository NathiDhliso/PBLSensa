import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, FileText, Network } from 'lucide-react';
import { useCourse } from '../../hooks';
import { Button } from '../../components/ui/Button';
import { DocumentsList, UploadDocumentModal } from '../../components/documents';
import { ConceptMapVisualization } from '../../components/conceptMap';
import { useConceptMap } from '../../hooks';
import { fadeIn } from '../../utils/animations';

type TabType = 'documents' | 'concept-map';

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [showUploadModal, setShowUploadModal] = useState(false);


  const { data: course, isLoading, error } = useCourse(courseId!);
  const { data: conceptMap, isLoading: isLoadingMap } = useConceptMap('course', courseId!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
          <div className="h-12 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="h-6 w-full max-w-2xl bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/courses')}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error?.message || 'Course not found'}
            </p>
            <Button onClick={() => navigate('/courses')}>
              Return to Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" style={fadeIn}>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link to="/courses" className="hover:text-purple-600 dark:hover:text-purple-400">
            Courses
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{course.name}</span>
        </nav>

        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {course.name}
              </h1>
              {course.description && (
                <p className="text-gray-600 dark:text-gray-300">
                  {course.description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/courses')}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
            </button>
            <button
              onClick={() => setActiveTab('concept-map')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'concept-map'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Network className="w-4 h-4" />
              Concept Map
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'documents' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <DocumentsList 
                courseId={courseId!} 
                onUploadClick={() => setShowUploadModal(true)}
              />
            </div>
          )}
          {activeTab === 'concept-map' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
              {isLoadingMap ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600 dark:text-gray-400">Loading concept map...</p>
                </div>
              ) : conceptMap ? (
                <ConceptMapVisualization
                  conceptMap={conceptMap}
                  onNodeClick={() => {
                    navigate(`/courses/${courseId}/concept-map`);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600 dark:text-gray-400">
                    No concept map available. Upload documents to generate one.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Upload Modal */}
        {showUploadModal && (
          <UploadDocumentModal
            courseId={courseId!}
            onClose={() => setShowUploadModal(false)}
          />
        )}
      </div>
    </div>
  );
};
