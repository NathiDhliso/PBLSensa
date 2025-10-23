import React, { useState } from 'react';
import { CheckCircle, XCircle, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConceptCard } from './ConceptCard';
import { usePBLConcepts, useValidateConcepts } from '@/hooks/usePBLConcepts';
import type { ConceptEdit } from '@/types/pbl';

interface ConceptReviewPanelProps {
  documentId: string;
  onComplete?: () => void;
}

export const ConceptReviewPanel: React.FC<ConceptReviewPanelProps> = ({
  documentId,
  onComplete,
}) => {
  const [filterValidated, setFilterValidated] = useState<boolean | undefined>(false);
  const [filterStructure, setFilterStructure] = useState<string | undefined>();
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [edited, setEdited] = useState<Map<string, ConceptEdit>>(new Map());

  const { data: concepts, isLoading } = usePBLConcepts(documentId, filterValidated, filterStructure);
  const validateMutation = useValidateConcepts(documentId);

  const handleApprove = (id: string) => {
    setApproved((prev) => new Set(prev).add(id));
    setRejected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReject = (id: string) => {
    setRejected((prev) => new Set(prev).add(id));
    setApproved((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleEdit = (id: string, term: string, definition: string) => {
    setEdited((prev) => new Map(prev).set(id, { id, term, definition }));
    setApproved((prev) => new Set(prev).add(id));
  };

  const handleApproveAll = () => {
    if (!concepts) return;
    const unvalidated = concepts.filter((c) => !c.validated);
    setApproved(new Set(unvalidated.map((c) => c.id)));
    setRejected(new Set());
  };

  const handleSubmit = async () => {
    await validateMutation.mutateAsync({
      approved: Array.from(approved),
      rejected: Array.from(rejected),
      edited: Array.from(edited.values()),
    });

    setApproved(new Set());
    setRejected(new Set());
    setEdited(new Map());

    if (onComplete) {
      onComplete();
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading concepts...</div>;
  }

  if (!concepts || concepts.length === 0) {
    return <div className="p-8 text-center text-gray-500">No concepts found</div>;
  }

  const unvalidatedCount = concepts.filter((c) => !c.validated).length;
  const validationProgress = ((approved.size + rejected.size) / unvalidatedCount) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Concepts</h2>
          <p className="text-gray-600">
            {unvalidatedCount} concepts to review • {approved.size} approved • {rejected.size} rejected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleApproveAll}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve All
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={approved.size === 0 && rejected.size === 0}
            isLoading={validateMutation.isPending}
          >
            Submit Validation
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {unvalidatedCount > 0 && (
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${validationProgress}%` }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filterValidated === undefined ? 'all' : filterValidated ? 'validated' : 'unvalidated'}
          onChange={(e) =>
            setFilterValidated(
              e.target.value === 'all' ? undefined : e.target.value === 'validated'
            )
          }
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Concepts</option>
          <option value="unvalidated">Unvalidated Only</option>
          <option value="validated">Validated Only</option>
        </select>

        <select
          value={filterStructure || 'all'}
          onChange={(e) => setFilterStructure(e.target.value === 'all' ? undefined : e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Types</option>
          <option value="hierarchical">Hierarchical</option>
          <option value="sequential">Sequential</option>
          <option value="unclassified">Unclassified</option>
        </select>
      </div>

      {/* Concept List */}
      <div className="space-y-4">
        {concepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={handleEdit}
            isSelected={approved.has(concept.id) || rejected.has(concept.id)}
          />
        ))}
      </div>
    </div>
  );
};
