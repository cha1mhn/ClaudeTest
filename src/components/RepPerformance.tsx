import { Users, TrendingUp, DollarSign, AlertTriangle, Target } from 'lucide-react';
import { RepPerformance as RepPerformanceType } from '@/types/hubspot';

interface RepPerformanceProps {
  performance: RepPerformanceType[];
}

export default function RepPerformance({ performance }: RepPerformanceProps) {
  if (performance.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Rep Performance
        </h2>
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No performance data
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Rep performance metrics will appear here
          </p>
        </div>
      </div>
    );
  }

  const sortedPerformance = [...performance].sort(
    (a, b) => b.coachingMoments.length - a.coachingMoments.length
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Rep Performance Overview</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rep Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Deals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  At Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pipeline Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Velocity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coaching Items
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPerformance.map((rep) => (
                <tr key={rep.repId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">
                          {rep.repName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {rep.repName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Target className="h-4 w-4 mr-2 text-blue-500" />
                      {rep.dealsInProgress}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rep.dealsAtRisk > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {rep.dealsAtRisk}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                      ${(rep.totalPipelineValue / 1000).toFixed(0)}K
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{rep.winRate}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${rep.winRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rep.averageDealVelocity} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rep.coachingMoments.length > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {rep.coachingMoments.length} action
                        {rep.coachingMoments.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Rep Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedPerformance
          .filter((rep) => rep.coachingMoments.length > 0)
          .map((rep) => (
            <div key={rep.repId} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-primary-200 rounded-full flex items-center justify-center">
                      <span className="text-base font-bold text-primary-700">
                        {rep.repName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rep.repName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {rep.dealsInProgress} active deals •{' '}
                        {rep.coachingMoments.length} coaching items
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Pipeline Value</span>
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      ${(rep.totalPipelineValue / 1000).toFixed(0)}K
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Win Rate</span>
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {rep.winRate}%
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    Priority Coaching Items:
                  </h4>
                  {rep.coachingMoments.slice(0, 3).map((moment) => (
                    <div
                      key={moment.id}
                      className="bg-orange-50 border border-orange-200 rounded-md p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900">
                            {moment.dealName}
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            {moment.message}
                          </p>
                        </div>
                        <span
                          className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            moment.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : moment.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {moment.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                  {rep.coachingMoments.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{rep.coachingMoments.length - 3} more coaching items
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
