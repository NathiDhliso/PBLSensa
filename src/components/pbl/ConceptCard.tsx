import React, { useState } from 'react';
import { Check, X, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { AudioNarration } from '../audio/AudioNarration';
import { useAudioCoordination } from '@/contexts/AudioCoordinationContext';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import type { Concept } from '@/types/pbl';

interface ConceptCardProps {
  concept: Concept;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, term: string, definition: string) => void;
  isSelected?: boolean;
  enableAudio?: boolean;
}

export const ConceptCard: React.FC<ConceptCardProps> = ({
  concept,
  onApprove,
  onReject,
  onEdit,
  isSelected = false,
  enableAudio = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTerm, setEditedTerm] = useState(concept.term);
  const [editedDefinition, setEditedDefinition] = useState(concept.definition);
  const { startNarration, stopNarration } = useAudioCoordination();

  const handleSaveEdit = () => {
    onEdit(concept.id, editedTerm, editedDefinition);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTerm(concept.term);
    setEditedDefinition(concept.definition);
    setIsEditing(false);
  };

  const structureColor = {
    hierarchical: 'bg-blue-100 text-blue-800',
    sequential: 'bg-green-100 text-green-800',
    unclassified: 'bg-gray-100 text-gray-800',
  }[concept.structure_type || 'unclassified'];

  return (
    <div
      className={`border rounded-lg p-4 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      } ${concept.validated ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedTerm}
                onChange={(e) => setEditedTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Term"
              />
              <textarea
                value={editedDefinition}
                onChange={(e) => setEditedDefinition(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Definition"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{concept.term}</h3>
                {concept.structure_type && (
                  <span className={`text-xs px-2 py-1 rounded ${structureColor}`}>
                    {concept.structure_type}
                  </span>
                )}
                {concept.validated && (
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                    Validated
                  </span>
                )}
              </div>
              <p className="text-gray-700 mb-2">{concept.definition}</p>
              <div className="text-sm text-gray-500 mb-3">
                Page {concept.page_number} • Importance: {(concept.importance_score * 100).toFixed(0)}%
              </div>
              
              {/* V7 Confidence Indicator */}
              {concept.confidence !== undefined && (
                <div className="mb-3">
                  <ConfidenceIndicator
                    confidence={concept.confidence}
                    methodsFound={concept.methods_found}
                    size="small"
                  />
                  {concept.extraction_methods && concept.extraction_methods.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {concept.extraction_methods.map((method) => (
                        <span
                          key={method}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: method === 'keybert' ? '#e9d5ff' : method === 'yake' ? '#dbeafe' : '#f3f4f6',
                            color: method === 'keybert' ? '#7c3aed' : method === 'yake' ? '#2563eb' : '#6b7280'
                          }}
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Audio Narration */}
              {enableAudio && !isEditing && (
                <div className="mt-3">
                  <AudioNarration
                    text={`${concept.term}. ${concept.definition}`}
                    contentId={`concept-${concept.id}`}
                    onNarrationStart={() => startNarration(`concept-${concept.id}`)}
                    onNarrationStop={() => stopNarration(`concept-${concept.id}`)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {!concept.validated && !isEditing && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApprove(concept.id)}
              className="text-green-600 hover:bg-green-50"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(concept.id)}
              className="text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {concept.source_sentences.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Source Context ({concept.source_sentences.length} sentences)
          </button>
          {isExpanded && (
            <div className="mt-2 space-y-2">
              {concept.source_sentences.map((sentence, idx) => (
                <p key={idx} className="text-sm text-gray-600 italic pl-4 border-l-2 border-gray-300">
                  "{sentence}"
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
