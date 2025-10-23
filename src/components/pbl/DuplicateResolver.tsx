import React, { useState } from 'react';
import { GitMerge, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { usePBLDuplicates, useMergeConcepts } from '@/hooks/usePBLDuplicates';
import type { DuplicatePair } from '@/types/pbl';

interface DuplicateResolverProps {
  documentId: string;
  onComplete?: () => void;
}

export const DuplicateResolver: React.FC<DuplicateResolverProps> = ({
  documentId,
  onComplete,
}) => {
  const { data, isLoading } = usePBLDuplicates(documentId);
  const mergeMutation = useMergeConcepts();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleMerge = async (primaryId: string, duplicateId: string) => {
    await mergeMutation.mutateAsync({ primaryId, duplicateId });
    setDismissed((prev) => new Set(prev).add(`${primaryId}-${duplicateId}`));
  };

  const handleDismiss = (primaryId: string, duplicateId: string) => {
    setDismissed((prev) => new Set(prev).add(`${primaryId}-${duplicateId}`));
  };

  if (isLoading) {
    return <div className="p-8 text-center">Finding duplicates...</div>;
  }

  if (!data || data.duplicates.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg font-medium">No duplicates found!</p>
        <p className="text-sm mt-2">All concepts appear to be unique.</p>
      </div>
    );
  }

  const visibleDuplicates = data.duplicates.filter(
    (dup) => !dismissed.has(`${dup.primary_id}-${dup.duplicate_id}`)
  );

  if (visibleDuplicates.length === 0 && dismissed.size > 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg font-medium">All duplicates resolved!</p>
        <p className="text-sm mt-2">
          {dismissed.size} duplicate{dismissed.size > 1 ? 's' : ''} processed.
        </p>
        {onComplete && (
          <Button onClick={onComplete} className="mt-4">
            Continue
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Resolve Duplicates</h2>
        <p className="text-gray-600">
          {visibleDuplicates.length} potential duplicate{visibleDuplicates.length > 1 ? 's' : ''} found
        </p>
      </div>

      <div className="space-y-4">
        {visibleDuplicates.map((duplicate) => (
          <DuplicateCard
            key={`${duplicate.primary_id}-${duplicate.duplicate_id}`}
            duplicate={duplicate}
            onMerge={handleMerge}
            onDismiss={handleDismiss}
            isLoading={mergeMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
};

interface DuplicateCardProps {
  duplicate: DuplicatePair;
  onMerge: (primaryId: string, duplicateId: string) => void;
  onDismiss: (primaryId: string, duplicateId: string) => void;
  isLoading: boolean;
}

const DuplicateCard: React.FC<DuplicateCardProps> = ({
  duplicate,
  onMerge,
  onDismiss,
  isLoading,
}) => {
  const similarityPercent = (duplicate.similarity_score * 100).toFixed(0);
  const isHighSimilarity = duplicate.similarity_score > 0.97;

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded ${
                isHighSimilarity
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {similarityPercent}% similar
            </span>
          </div>
          <p className="text-sm text-gray-600">{duplicate.reason}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">PRIMARY (KEEP)</div>
          <div className="font-semibold">{duplicate.primary_term}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 font-medium mb-1">DUPLICATE (MERGE)</div>
          <div className="font-semibold">{duplicate.duplicate_term}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onMerge(duplicate.primary_id, duplicate.duplicate_id)}
          disabled={isLoading}
          className="flex-1"
        >
          <GitMerge className="w-4 h-4 mr-2" />
          Merge Concepts
        </Button>
        <Button
          variant="outline"
          onClick={() => onDismiss(duplicate.primary_id, duplicate.duplicate_id)}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          Keep Separate
        </Button>
      </div>
    </div>
  );
};
