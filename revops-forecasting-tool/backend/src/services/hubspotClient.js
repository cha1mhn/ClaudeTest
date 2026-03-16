const { Client } = require('@hubspot/api-client');
const { logger } = require('../utils/logger');

let _client = null;

function getClient() {
  if (_client) return _client;

  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN is required. Set it in your .env file.');
  }

  _client = new Client({ accessToken });
  logger.info('HubSpot client initialized');
  return _client;
}

/**
 * Fetch all deals with pipeline/stage data using pagination.
 * @param {object} filters - optional filters { ownerId, pipelineId, startDate, endDate }
 */
async function fetchDeals(filters = {}) {
  const client = getClient();
  const properties = [
    'dealname', 'amount', 'dealstage', 'pipeline', 'closedate',
    'hubspot_owner_id', 'hs_deal_stage_probability', 'createdate',
    'hs_closed_amount', 'hs_forecast_amount', 'hs_forecast_category',
    'hs_tcv', 'hs_acv', 'hs_arr',
  ];

  const filterGroups = [];

  if (filters.ownerId) {
    filterGroups.push({
      filters: [{ propertyName: 'hubspot_owner_id', operator: 'EQ', value: filters.ownerId }],
    });
  }

  if (filters.pipelineId) {
    filterGroups.push({
      filters: [{ propertyName: 'pipeline', operator: 'EQ', value: filters.pipelineId }],
    });
  }

  if (filters.startDate) {
    filterGroups.push({
      filters: [{ propertyName: 'closedate', operator: 'GTE', value: new Date(filters.startDate).getTime().toString() }],
    });
  }

  if (filters.endDate) {
    filterGroups.push({
      filters: [{ propertyName: 'closedate', operator: 'LTE', value: new Date(filters.endDate).getTime().toString() }],
    });
  }

  const allDeals = [];
  let after;

  do {
    const response = await client.crm.deals.searchApi.doSearch({
      filterGroups: filterGroups.length > 0 ? filterGroups : [{ filters: [] }],
      properties,
      limit: 100,
      after,
      sorts: [{ propertyName: 'closedate', direction: 'ASCENDING' }],
    });

    allDeals.push(...response.results);
    after = response.paging?.next?.after;
  } while (after);

  return allDeals;
}

/**
 * Fetch pipeline stages with probabilities.
 */
async function fetchPipelineStages(pipelineId = 'default') {
  const client = getClient();
  const pipelines = await client.crm.pipelines.pipelinesApi.getAll('deals');
  const pipeline = pipelines.results.find((p) => p.id === pipelineId || p.label.toLowerCase() === 'sales pipeline') || pipelines.results[0];

  if (!pipeline) return [];

  const stages = await client.crm.pipelines.pipelineStagesApi.getAll('deals', pipeline.id);
  return stages.results.map((s) => ({
    id: s.id,
    label: s.label,
    probability: parseFloat(s.metadata?.probability || 0),
    displayOrder: s.displayOrder,
  })).sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Fetch all pipelines.
 */
async function fetchPipelines() {
  const client = getClient();
  const response = await client.crm.pipelines.pipelinesApi.getAll('deals');
  return response.results.map((p) => ({ id: p.id, label: p.label }));
}

/**
 * Fetch owners (sales reps).
 */
async function fetchOwners() {
  const client = getClient();
  const response = await client.crm.owners.ownersApi.getPage();
  return response.results.map((o) => ({
    id: o.id,
    name: `${o.firstName || ''} ${o.lastName || ''}`.trim() || o.email,
    email: o.email,
  }));
}

module.exports = { fetchDeals, fetchPipelineStages, fetchPipelines, fetchOwners };
