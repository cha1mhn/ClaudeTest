import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hubspotService } from '@/services/hubspot';
import DashboardHeader from '@/components/DashboardHeader';
import DealRiskIndicators from '@/components/DealRiskIndicators';
import PipelineVelocity from '@/components/PipelineVelocity';
import CoachingMoments from '@/components/CoachingMoments';
import RepPerformance from '@/components/RepPerformance';
import { BarChart3, AlertTriangle, Target, Users } from 'lucide-react';

type TabView = 'overview' | 'deals' | 'pipeline' | 'reps';

function App() {
  const [activeTab, setActiveTab] = useState<TabView>('overview');

  const { data: riskIndicators, isLoading: loadingRisks } = useQuery({
    queryKey: ['dealRisks'],
    queryFn: () => hubspotService.getDealRiskIndicators(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: velocityMetrics, isLoading: loadingVelocity } = useQuery({
    queryKey: ['pipelineVelocity'],
    queryFn: () => hubspotService.getPipelineVelocityMetrics(),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: coachingMoments, isLoading: loadingMoments } = useQuery({
    queryKey: ['coachingMoments'],
    queryFn: () => hubspotService.getCoachingMoments(),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: repPerformance, isLoading: loadingReps } = useQuery({
    queryKey: ['repPerformance'],
    queryFn: () => hubspotService.getRepPerformance(),
    refetchInterval: 5 * 60 * 1000,
  });

  const tabs = [
    { id: 'overview' as TabView, label: 'Overview', icon: BarChart3 },
    { id: 'deals' as TabView, label: 'At-Risk Deals', icon: AlertTriangle },
    { id: 'pipeline' as TabView, label: 'Pipeline Health', icon: Target },
    { id: 'reps' as TabView, label: 'Rep Performance', icon: Users },
  ];

  const isLoading = loadingRisks || loadingVelocity || loadingMoments || loadingReps;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        -ml-0.5 mr-2 h-5 w-5
                        ${
                          activeTab === tab.id
                            ? 'text-primary-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Tab Content */}
        {!isLoading && (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <CoachingMoments moments={coachingMoments || []} limit={5} />
                <DealRiskIndicators indicators={riskIndicators || []} limit={5} />
                <PipelineVelocity metrics={velocityMetrics || []} />
              </div>
            )}

            {activeTab === 'deals' && (
              <DealRiskIndicators indicators={riskIndicators || []} />
            )}

            {activeTab === 'pipeline' && (
              <PipelineVelocity metrics={velocityMetrics || []} />
            )}

            {activeTab === 'reps' && (
              <RepPerformance performance={repPerformance || []} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
