import React from 'react';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ProcessingStatus } from '@/types/pbl';

interface ProcessingStatusDisplayProps {
  status: ProcessingStatus;
  onCancel?: () => void;
}

export const ProcessingStatusDisplay: React.FC<ProcessingStatusDisplayProps> = ({
  status,
  onCancel,
}) => {
  const isProcessing = status.status === 'processing';
  const isCompleted = status.status === 'completed';
  const isFailed = status.status === 'failed';

  const stages = ['parsing', 'extraction', 'classification', 'deduplication', 'visualization'];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Status Icon */}
      <div className="flex items-center justify-center mb-6">
        {isProcessing && (
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">
                {status.progress ? `${Math.round(status.progress * 100)}%` : ''}
              </span>
            </div>
          </div>
        )}
        {isCompleted && <CheckCircle className="w-16 h-16 text-green-600" />}
        {isFailed && <XCircle className="w-16 h-16 text-red-600" />}
      </div>

      {/* Status Message */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {isProcessing && 'Processing Document...'}
          {isCompleted && 'Processing Complete!'}
          {isFailed && 'Processing Failed'}
        </h2>
        {status.current_stage && isProcessing && (
          <p className="text-gray-600">
            Current stage: <span className="font-medium capitalize">{status.current_stage}</span>
          </p>
        )}
        {status.estimated_time_remaining && isProcessing && (
          <p className="text-sm text-gray-500 mt-1">
            Estimated time remaining: {Math.ceil(status.estimated_time_remaining / 60)} minutes
          </p>
        )}
        {status.error && isFailed && (
          <p className="text-red-600 mt-2">{status.error}</p>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && status.progress !== undefined && (
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${status.progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stage Progress */}
      {isProcessing && (
        <div className="space-y-3 mb-6">
          {stages.map((stage) => {
            const isCompleted = status.stages_completed?.includes(stage);
            const isCurrent = stage === status.current_stage;
            const isPending = !isCompleted && !isCurrent;

            return (
              <div
                key={stage}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  isCompleted
                    ? 'bg-green-50'
                    : isCurrent
                    ? 'bg-blue-50'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {isCurrent && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
                  {isPending && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium capitalize">{stage}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Partial Results Warning */}
      {isFailed && status.partial_results && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Partial Results Available</p>
              <p className="text-sm text-yellow-700 mt-1">
                Some stages completed successfully before the error occurred.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isProcessing && onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        {isCompleted && (
          <Button className="flex-1" onClick={() => window.location.reload()}>
            View Results
          </Button>
        )}
        {isFailed && (
          <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};
