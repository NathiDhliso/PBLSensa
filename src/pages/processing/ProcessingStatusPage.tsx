import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';
import { useProcessingStatus } from '../../hooks';
import { Button } from '../../components/ui/Button';
import { fadeIn } from '../../utils/animations';

export const ProcessingStatusPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const { data: status, isLoading, error } = useProcessingStatus(taskId!, {
    enabled: !!taskId,
  });

  const getProgressPercentage = () => {
    if (!status) return 0;
    
    switch (status.status) {
      case 'pending':
        return 10;
      case 'processing':
        return status.progress || 50;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  const getStatusIcon = () => {
    if (!status) return null;

    switch (status.status) {
      case 'completed':
        return <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />;
      default:
        return <Loader2 className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    if (!status) return 'Loading...';

    switch (status.status) {
      case 'pending':
        return 'Your document is queued for processing';
      case 'processing':
        return status.message || 'Processing your document';
      case 'completed':
        return 'Document processed successfully!';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  const handleViewConceptMap = () => {
    // Navigate to PBL document workflow if we have document_id
    if (status?.document_id) {
      navigate(`/pbl/document/${status.document_id}`);
    } else {
      // Fallback to courses
      navigate('/pbl/courses');
    }
  };

  const handleTryAgain = () => {
    navigate('/pbl/courses');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Status
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error.message || 'Could not retrieve processing status'}
          </p>
          <Button onClick={() => navigate('/pbl/courses')}>
            Return to Courses
          </Button>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage();
  const isComplete = status?.status === 'completed';
  const isFailed = status?.status === 'failed';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" style={fadeIn}>
      <div className="max-w-2xl mx-auto pt-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/pbl/courses')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          {getStatusMessage()}
        </h2>

        {/* Progress Bar */}
        {!isFailed && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  isComplete
                    ? 'bg-green-600'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Message */}
        {status?.status === 'processing' && status.message && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {status.message}
            </p>
          </div>
        )}

        {/* Estimated Time */}
        {status?.status === 'processing' && status.estimated_time_remaining && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
            Estimated time remaining: {Math.round(status.estimated_time_remaining / 60)} minutes
          </p>
        )}

        {/* Error Message */}
        {isFailed && status.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              {status.error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          {isComplete && (
            <Button
              variant="primary"
              onClick={handleViewConceptMap}
              className="flex items-center gap-2"
            >
              View Concept Map
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          
          {isFailed && (
            <Button
              variant="primary"
              onClick={handleTryAgain}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}

          {!isComplete && !isFailed && (
            <Button
              variant="ghost"
              onClick={() => navigate('/pbl/courses')}
            >
              Return to Courses
            </Button>
          )}
        </div>

        {/* Info Text */}
        {!isComplete && !isFailed && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            You can safely leave this page. Processing will continue in the background.
          </p>
        )}
        </div>
      </div>
    </div>
  );
};
