import { AlertCircle, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { CoachingMoment } from '@/types/hubspot';
import { formatDistanceToNow } from 'date-fns';

interface CoachingMomentsProps {
  moments: CoachingMoment[];
  limit?: number;
}

export default function CoachingMoments({ moments, limit }: CoachingMomentsProps) {
  const displayedMoments = limit ? moments.slice(0, limit) : moments;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deal_at_risk: 'Deal at Risk',
      stuck_deal: 'Stuck Deal',
      no_activity: 'No Activity',
      low_engagement: 'Low Engagement',
      overdue_task: 'Overdue Task',
    };
    return labels[type] || type;
  };

  if (displayedMoments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Coaching Moments</h2>
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No coaching moments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Everything looks good across your team!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Coaching Moments</h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            {moments.length} action{moments.length !== 1 ? 's' : ''} needed
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {displayedMoments.map((moment) => (
          <div
            key={moment.id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  {getPriorityIcon(moment.priority)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                          moment.priority
                        )}`}
                      >
                        {moment.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getTypeLabel(moment.type)}
                      </span>
                    </div>

                    <h3 className="text-base font-medium text-gray-900 mb-1">
                      {moment.dealName || 'General Coaching'}
                    </h3>

                    <p className="text-sm text-gray-700 mb-2">{moment.message}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>Rep: {moment.repName}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(moment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-2">
                        Recommended Action Items:
                      </p>
                      <ul className="space-y-1">
                        {moment.actionItems.map((action, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-blue-800 flex items-start"
                          >
                            <span className="mr-2">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <a
                href={moment.hubspotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Take Action
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {limit && moments.length > limit && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Showing {limit} of {moments.length} coaching moments
          </p>
        </div>
      )}
    </div>
  );
}
