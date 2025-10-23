/**
 * Concept Map Page - Two-View Learning System
 * Allows switching between PBL View and Sensa Learn View
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ViewSwitcher } from '@/components/sensa/ViewSwitcher';
import { ConceptMapVisualization } from '@/components/conceptMap/ConceptMapVisualization';
import { SensaLearnMap } from '@/components/sensa/SensaLearnMap';
import { Button } from '@/components/ui';
import { useChapterAnalogies } from '@/hooks/useChapterAnalogies';

export const ConceptMapPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<'pbl' | 'sensa'>('pbl');
  
  const { data: analogiesData } = useChapterAnalogies(documentId || '', '1');
  const analogies = analogiesData?.analogies || [];
  
  // Mock concept map data - replace with real API call
  const conceptMap: any = {
    course_id: documentId || 'mock-course',
    chapters: [
      {
        chapter_number: 1,
        title: 'Introduction to Databases',
        keywords: [
          {
            term: 'Database',
            definition: 'A structured collection of data',
            is_primary: true,
            structure_type: 'hierarchical',
            exam_relevant: 'high',
          },
          {
            term: 'Query',
            definition: 'A request for data from a database',
            is_primary: true,
            structure_type: 'sequential',
            exam_relevant: 'medium',
          },
          {
            term: 'Schema',
            definition: 'The structure of a database',
            is_primary: true,
            structure_type: 'hierarchical',
            exam_relevant: 'high',
          },
        ],
        relationships: [
          {
            source: 'Database',
            target: 'Schema',
            type: 'has_component',
            structure_category: 'hierarchical',
            strength: 0.9,
          },
          {
            source: 'Schema',
            target: 'Query',
            type: 'enables',
            structure_category: 'sequential',
            strength: 0.8,
          },
        ],
      },
    ],
    global_relationships: [],
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/sensa')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">
              {view === 'pbl' ? 'PBL View - Objective Knowledge' : 'Sensa Learn View - Personal Learning'}
            </h1>
          </div>
          <ViewSwitcher currentView={view} onViewChange={setView} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'pbl' ? (
          <ConceptMapVisualization
            conceptMap={conceptMap}
            showExamRelevanceFilter={true}
          />
        ) : (
          <SensaLearnMap
            conceptMap={conceptMap}
            analogies={analogies.map((a: any) => ({
              id: a.id,
              analogy_id: a.id,
              concept_id: a.concept_id || '',
              experience_text: a.user_experience_text || a.analogy_text || '',
              strength: a.strength || 0,
              tags: a.tags || [],
            }))}
            mode="overlay"
          />
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-2">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400">
          {view === 'pbl' ? (
            <span>
              <strong className="text-blue-400">Blue borders</strong> = Hierarchical concepts • 
              <strong className="text-green-400 ml-2">Green borders</strong> = Sequential concepts
            </span>
          ) : (
            <span>
              <strong className="text-blue-400">Blue nodes</strong> = Concepts • 
              <strong className="text-orange-400 ml-2">Warm colors</strong> = Your analogies
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
