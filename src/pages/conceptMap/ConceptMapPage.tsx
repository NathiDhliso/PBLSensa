import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useConceptMap } from '../../hooks';
import { Button } from '../../components/ui/Button';
import { ConceptMapVisualization, ConceptDetailPanel } from '../../components/conceptMap';
import { Concept } from '../../types/conceptMap';
import { fadeIn } from '../../utils/animations';

export const ConceptMapPage: React.FC = () => {
  const { courseId, documentId } = useParams<{ courseId: string; documentId: string }>();
  const navigate = useNavigate();
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [hoveredConcept, setHoveredConcept] = useState<Concept | null>(null);

  // Determine which concept map to fetch
  const mapType = documentId ? 'document' : 'course';
  const mapId = documentId || courseId;

  const { data: conceptMap, isLoading, error } = useConceptMap(mapType, mapId!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading concept map...</p>
        </div>
      </div>
    );
  }

  if (error || !conceptMap) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error?.message || 'Failed to load concept map'}
            </p>
            <Button onClick={() => navigate(`/courses/${courseId}`)}>
              Return to Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={fadeIn}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Concept Map
              </h1>
              <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Link to="/courses" className="hover:text-purple-600 dark:hover:text-purple-400">
                  Courses
                </Link>
                <span>/</span>
                <Link to={`/courses/${courseId}`} className="hover:text-purple-600 dark:hover:text-purple-400">
                  Course
                </Link>
                <span>/</span>
                <span className="text-gray-900 dark:text-white">Concept Map</span>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Concept Map Visualization */}
        <div className="flex-1 p-6">
          <ConceptMapVisualization
            conceptMap={conceptMap}
            onNodeClick={setSelectedConcept}
            onNodeHover={setHoveredConcept}
            highlightedNodes={selectedConcept ? new Set([selectedConcept.id]) : undefined}
          />
        </div>

        {/* Detail Panel */}
        {selectedConcept && (
          <ConceptDetailPanel
            concept={selectedConcept}
            onClose={() => setSelectedConcept(null)}
            onConceptClick={setSelectedConcept}
          />
        )}
      </div>

      {/* Hover Tooltip */}
      {hoveredConcept && !selectedConcept && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg max-w-md z-50">
          <p className="font-semibold">{hoveredConcept.name}</p>
          {hoveredConcept.description && (
            <p className="text-sm text-gray-300 mt-1 line-clamp-2">
              {hoveredConcept.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
