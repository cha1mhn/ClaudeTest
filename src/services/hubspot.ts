import axios from 'axios';
import {
  HubSpotDeal,
  HubSpotOwner,
  HubSpotPipeline,
  HubSpotNote,
  DealRiskIndicator,
  PipelineVelocity,
  CoachingMoment,
  RepPerformance,
} from '@/types/hubspot';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const API_KEY = import.meta.env.VITE_HUBSPOT_API_KEY;
const PORTAL_ID = import.meta.env.VITE_HUBSPOT_PORTAL_ID;

const hubspotClient = axios.create({
  baseURL: HUBSPOT_API_BASE,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const hubspotService = {
  // Fetch all deals
  async getDeals(): Promise<HubSpotDeal[]> {
    try {
      const response = await hubspotClient.get('/crm/v3/objects/deals', {
        params: {
          limit: 100,
          properties: [
            'dealname',
            'amount',
            'closedate',
            'dealstage',
            'pipeline',
            'hubspot_owner_id',
            'createdate',
            'hs_lastmodifieddate',
            'days_to_close',
            'hs_deal_stage_probability',
          ],
        },
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  },

  // Fetch deal owners
  async getOwners(): Promise<HubSpotOwner[]> {
    try {
      const response = await hubspotClient.get('/crm/v3/owners');
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching owners:', error);
      return [];
    }
  },

  // Fetch pipelines
  async getPipelines(): Promise<HubSpotPipeline[]> {
    try {
      const response = await hubspotClient.get('/crm/v3/pipelines/deals');
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      return [];
    }
  },

  // Fetch notes for a deal
  async getDealNotes(dealId: string): Promise<HubSpotNote[]> {
    try {
      const response = await hubspotClient.get(
        `/crm/v3/objects/deals/${dealId}/associations/notes`
      );
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching deal notes:', error);
      return [];
    }
  },

  // Generate HubSpot URL for a deal
  getHubSpotDealUrl(dealId: string): string {
    return `https://app.hubspot.com/contacts/${PORTAL_ID}/deal/${dealId}`;
  },

  // Generate HubSpot URL for a contact
  getHubSpotContactUrl(contactId: string): string {
    return `https://app.hubspot.com/contacts/${PORTAL_ID}/contact/${contactId}`;
  },

  // Calculate deal risk indicators
  async getDealRiskIndicators(): Promise<DealRiskIndicator[]> {
    const deals = await this.getDeals();
    const owners = await this.getOwners();

    const ownerMap = new Map(owners.map(o => [o.id, `${o.firstName} ${o.lastName}`]));

    return deals
      .filter(deal => !deal.archived)
      .map(deal => {
        const riskFactors: string[] = [];
        let riskLevel: 'high' | 'medium' | 'low' = 'low';

        const amount = parseFloat(deal.properties.amount || '0');
        const lastModified = new Date(deal.properties.hs_lastmodifieddate);
        const daysInactive = Math.floor(
          (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Risk factor: No recent activity
        if (daysInactive > 14) {
          riskFactors.push(`No activity for ${daysInactive} days`);
          riskLevel = 'high';
        } else if (daysInactive > 7) {
          riskFactors.push(`${daysInactive} days since last activity`);
          riskLevel = riskLevel === 'high' ? 'high' : 'medium';
        }

        // Risk factor: Large deal value
        if (amount > 50000) {
          riskFactors.push('High-value deal requires attention');
        }

        // Risk factor: Close date approaching or overdue
        if (deal.properties.closedate) {
          const closeDate = new Date(deal.properties.closedate);
          const daysToClose = Math.floor(
            (closeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          if (daysToClose < 0) {
            riskFactors.push(`Overdue by ${Math.abs(daysToClose)} days`);
            riskLevel = 'high';
          } else if (daysToClose < 7 && daysToClose >= 0) {
            riskFactors.push(`Closes in ${daysToClose} days`);
            riskLevel = riskLevel === 'high' ? 'high' : 'medium';
          }
        }

        return {
          dealId: deal.id,
          dealName: deal.properties.dealname || 'Unnamed Deal',
          ownerName: ownerMap.get(deal.properties.hubspot_owner_id) || 'Unassigned',
          riskLevel,
          riskFactors,
          amount,
          stage: deal.properties.dealstage || 'Unknown',
          daysInStage: daysInactive,
          lastActivity: deal.properties.hs_lastmodifieddate,
          hubspotUrl: this.getHubSpotDealUrl(deal.id),
        };
      })
      .filter(indicator => indicator.riskFactors.length > 0)
      .sort((a, b) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      });
  },

  // Calculate pipeline velocity metrics
  async getPipelineVelocityMetrics(): Promise<PipelineVelocity[]> {
    const [deals, pipelines] = await Promise.all([
      this.getDeals(),
      this.getPipelines(),
    ]);

    return pipelines.map(pipeline => {
      const pipelineDeals = deals.filter(
        deal => deal.properties.pipeline === pipeline.id && !deal.archived
      );

      const closedWonDeals = pipelineDeals.filter(
        deal => deal.properties.dealstage.includes('closedwon')
      );

      const avgDaysToClose =
        closedWonDeals.length > 0
          ? closedWonDeals.reduce((sum, deal) => {
              const created = new Date(deal.properties.createdate);
              const closed = new Date(deal.properties.closedate);
              const days = Math.floor(
                (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / closedWonDeals.length
          : 0;

      const totalValue = pipelineDeals.reduce(
        (sum, deal) => sum + parseFloat(deal.properties.amount || '0'),
        0
      );

      const conversionRate =
        pipelineDeals.length > 0
          ? (closedWonDeals.length / pipelineDeals.length) * 100
          : 0;

      const stageMetrics = pipeline.stages.map(stage => {
        const stageDeals = pipelineDeals.filter(
          deal => deal.properties.dealstage === stage.id
        );

        const avgDaysInStage =
          stageDeals.length > 0
            ? stageDeals.reduce((sum, deal) => {
                const lastModified = new Date(deal.properties.hs_lastmodifieddate);
                const days = Math.floor(
                  (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
                );
                return sum + days;
              }, 0) / stageDeals.length
            : 0;

        const stuckDeals = stageDeals.filter(deal => {
          const lastModified = new Date(deal.properties.hs_lastmodifieddate);
          const daysInactive = Math.floor(
            (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysInactive > 14;
        }).length;

        return {
          stageName: stage.label,
          dealsCount: stageDeals.length,
          averageDaysInStage: Math.round(avgDaysInStage),
          conversionRate: stage.probability,
          stuckDeals,
        };
      });

      return {
        pipelineId: pipeline.id,
        pipelineName: pipeline.label,
        averageDaysToClose: Math.round(avgDaysToClose),
        conversionRate: Math.round(conversionRate),
        dealsInPipeline: pipelineDeals.length,
        totalValue,
        stageMetrics,
      };
    });
  },

  // Generate coaching moments
  async getCoachingMoments(): Promise<CoachingMoment[]> {
    const [deals, owners] = await Promise.all([
      this.getDeals(),
      this.getOwners(),
    ]);

    const ownerMap = new Map(owners.map(o => [o.id, `${o.firstName} ${o.lastName}`]));
    const moments: CoachingMoment[] = [];

    deals.forEach(deal => {
      if (deal.archived) return;

      const lastModified = new Date(deal.properties.hs_lastmodifieddate);
      const daysInactive = Math.floor(
        (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
      );
      const amount = parseFloat(deal.properties.amount || '0');
      const ownerId = deal.properties.hubspot_owner_id;
      const ownerName = ownerMap.get(ownerId) || 'Unassigned';

      // Stuck deal
      if (daysInactive > 14) {
        moments.push({
          id: `${deal.id}-stuck`,
          type: 'stuck_deal',
          priority: amount > 50000 ? 'high' : 'medium',
          dealId: deal.id,
          dealName: deal.properties.dealname || 'Unnamed Deal',
          repName: ownerName,
          repId: ownerId,
          message: `Deal has been inactive for ${daysInactive} days`,
          actionItems: [
            'Review deal status with rep',
            'Check if contact is still engaged',
            'Update deal stage or close date',
            'Schedule follow-up activity',
          ],
          hubspotUrl: this.getHubSpotDealUrl(deal.id),
          createdAt: new Date().toISOString(),
        });
      }

      // Overdue close date
      if (deal.properties.closedate) {
        const closeDate = new Date(deal.properties.closedate);
        const daysOverdue = Math.floor(
          (Date.now() - closeDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysOverdue > 0) {
          moments.push({
            id: `${deal.id}-overdue`,
            type: 'deal_at_risk',
            priority: 'high',
            dealId: deal.id,
            dealName: deal.properties.dealname || 'Unnamed Deal',
            repName: ownerName,
            repId: ownerId,
            message: `Deal is ${daysOverdue} days overdue`,
            actionItems: [
              'Discuss why deal did not close on time',
              'Update close date or mark as lost',
              'Review qualification criteria',
              'Coach on forecasting accuracy',
            ],
            hubspotUrl: this.getHubSpotDealUrl(deal.id),
            createdAt: new Date().toISOString(),
          });
        }
      }

      // No activity on high-value deal
      if (amount > 50000 && daysInactive > 7) {
        moments.push({
          id: `${deal.id}-no-activity`,
          type: 'no_activity',
          priority: 'high',
          dealId: deal.id,
          dealName: deal.properties.dealname || 'Unnamed Deal',
          repName: ownerName,
          repId: ownerId,
          message: `High-value deal ($${amount.toLocaleString()}) needs attention`,
          actionItems: [
            'Schedule check-in with rep',
            'Review engagement strategy',
            'Ensure key stakeholders are engaged',
            'Identify potential blockers',
          ],
          hubspotUrl: this.getHubSpotDealUrl(deal.id),
          createdAt: new Date().toISOString(),
        });
      }
    });

    return moments.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  // Get rep performance data
  async getRepPerformance(): Promise<RepPerformance[]> {
    const [deals, owners, coachingMoments] = await Promise.all([
      this.getDeals(),
      this.getOwners(),
      this.getCoachingMoments(),
    ]);

    return owners.map(owner => {
      const repDeals = deals.filter(
        deal => deal.properties.hubspot_owner_id === owner.id && !deal.archived
      );

      const dealsInProgress = repDeals.filter(
        deal => !deal.properties.dealstage.includes('closed')
      ).length;

      const closedDeals = repDeals.filter(deal =>
        deal.properties.dealstage.includes('closed')
      );

      const wonDeals = closedDeals.filter(deal =>
        deal.properties.dealstage.includes('closedwon')
      );

      const winRate =
        closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;

      const avgVelocity =
        wonDeals.length > 0
          ? wonDeals.reduce((sum, deal) => {
              const created = new Date(deal.properties.createdate);
              const closed = new Date(deal.properties.closedate);
              const days = Math.floor(
                (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / wonDeals.length
          : 0;

      const totalPipelineValue = repDeals
        .filter(deal => !deal.properties.dealstage.includes('closed'))
        .reduce((sum, deal) => sum + parseFloat(deal.properties.amount || '0'), 0);

      const repCoachingMoments = coachingMoments.filter(
        moment => moment.repId === owner.id
      );

      const dealsAtRisk = new Set(
        repCoachingMoments.map(moment => moment.dealId)
      ).size;

      return {
        repId: owner.id,
        repName: `${owner.firstName} ${owner.lastName}`,
        dealsInProgress,
        dealsAtRisk,
        averageDealVelocity: Math.round(avgVelocity),
        winRate: Math.round(winRate),
        totalPipelineValue,
        coachingMoments: repCoachingMoments,
      };
    }).filter(rep => rep.dealsInProgress > 0 || rep.coachingMoments.length > 0);
  },
};
