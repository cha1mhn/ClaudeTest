import { AlertTriangle, ExternalLink, DollarSign, Clock } from 'lucide-react';
import { DealRiskIndicator } from '@/types/hubspot';

interface DealRiskIndicatorsProps {
  indicators: DealRiskIndicator[];
  limit?: number;
}

export default function DealRiskIndicators({ indicators, limit }: DealRiskIndicatorsProps) {
  const displayedIndicators = limit ? indicators.slice(0, limit) : indicators;

  const getRiskColor = (level: string) => {
    switch (level) {
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

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (displayedIndicators.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Risk Indicators</h2>
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No at-risk deals</h3>
          <p className="mt-1 text-sm text-gray-500">All deals are on track!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Deal Risk Indicators</h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            {indicators.length} at risk
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {displayedIndicators.map((indicator) => (
          <div
            key={indicator.dealId}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${getRiskBadgeColor(
                      indicator.riskLevel
                    )}`}
                  />
                  <h3 className="text-base font-medium text-gray-900">
                    {indicator.dealName}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(
                      indicator.riskLevel
                    )}`}
                  >
                    {indicator.riskLevel.toUpperCase()} RISK
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    ${indicator.amount.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {indicator.daysInStage} days in stage
                  </span>
                  <span>Owner: {indicator.ownerName}</span>
                  <span className="text-gray-400">Stage: {indicator.stage}</span>
                </div>

                <div className="space-y-1">
                  {indicator.riskFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-start text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href={indicator.hubspotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Open in HubSpot
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {limit && indicators.length > limit && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Showing {limit} of {indicators.length} at-risk deals
          </p>
        </div>
      )}
    </div>
  );
}
