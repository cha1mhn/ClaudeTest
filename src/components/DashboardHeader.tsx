import { TrendingUp, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function DashboardHeader() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                CSO Coaching Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time visibility into deals, pipeline, and coaching opportunities
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <RefreshCw
              className={`-ml-1 mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh Data
          </button>
        </div>
      </div>
    </header>
  );
}
