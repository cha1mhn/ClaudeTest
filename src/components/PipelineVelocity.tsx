import { Target, TrendingUp, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { PipelineVelocity as PipelineVelocityType } from '@/types/hubspot';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PipelineVelocityProps {
  metrics: PipelineVelocityType[];
}

export default function PipelineVelocity({ metrics }: PipelineVelocityProps) {
  if (metrics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Velocity</h2>
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pipeline data</h3>
          <p className="mt-1 text-sm text-gray-500">Pipeline metrics will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {metrics.map((pipeline) => {
        const chartData = pipeline.stageMetrics.map((stage) => ({
          name: stage.stageName,
          deals: stage.dealsCount,
          avgDays: stage.averageDaysInStage,
          stuck: stage.stuckDeals,
        }));

        return (
          <div key={pipeline.pipelineId} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {pipeline.pipelineName}
              </h2>
            </div>

            <div className="p-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Deals</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        {pipeline.dealsInPipeline}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Total Value
                      </p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        ${(pipeline.totalValue / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-900">
                        Avg Days to Close
                      </p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {pipeline.averageDaysToClose}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Conversion Rate
                      </p>
                      <p className="text-2xl font-bold text-orange-900 mt-1">
                        {pipeline.conversionRate}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Stage Distribution Chart */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Deals by Stage
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="deals" fill="#3b82f6" name="Total Deals" />
                    <Bar dataKey="stuck" fill="#f59e0b" name="Stuck Deals" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stage Details Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Days in Stage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stuck Deals
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pipeline.stageMetrics.map((stage, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stage.stageName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stage.dealsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stage.averageDaysInStage} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stage.conversionRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {stage.stuckDeals > 0 ? (
                            <span className="inline-flex items-center text-orange-700">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {stage.stuckDeals}
                            </span>
                          ) : (
                            <span className="text-gray-500">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
