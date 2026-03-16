const { Client } = require('@hubspot/api-client');
const { logger } = require('../utils/logger');

let _client = null;

function getClient() {
  if (_client) return _client;
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN is required');
  _client = new Client({ accessToken: token });
  logger.info('HubSpot client initialised');
  return _client;
}

const DEAL_PROPS = [
  'dealname', 'amount', 'dealstage', 'pipeline', 'closedate',
  'hubspot_owner_id', 'createdate', 'hs_lastmodifieddate',
  'hs_deal_stage_probability', 'notes_last_updated',
  'num_associated_contacts', 'hs_next_step', 'description',
  'hs_forecast_category', 'hs_object_id',
];

const CONTACT_PROPS = [
  'firstname', 'lastname', 'email', 'phone', 'company',
  'jobtitle', 'lifecyclestage', 'hs_lead_status',
  'city', 'state', 'country', 'linkedin_url',
  'associatedcompanyid', 'hs_email_last_reply_date',
];

async function fetchAllDeals(filters = {}) {
  const client = getClient();
  const filterGroups = [];

  if (filters.pipelineId) {
    filterGroups.push({ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: filters.pipelineId }] });
  }
  if (filters.ownerId) {
    filterGroups.push({ filters: [{ propertyName: 'hubspot_owner_id', operator: 'EQ', value: filters.ownerId }] });
  }

  const allDeals = [];
  let after;
  do {
    const res = await client.crm.deals.searchApi.doSearch({
      filterGroups: filterGroups.length ? filterGroups : [{ filters: [] }],
      properties: DEAL_PROPS,
      limit: 100,
      after,
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
    });
    allDeals.push(...res.results);
    after = res.paging?.next?.after;
  } while (after);

  return allDeals;
}

async function fetchContactsForDeals(dealIds) {
  const client = getClient();
  const contacts = [];

  // Batch association lookup — max 100 per call
  for (let i = 0; i < dealIds.length; i += 100) {
    const batch = dealIds.slice(i, i + 100);
    const res = await client.crm.associations.batchApi.read('deals', 'contacts', {
      inputs: batch.map((id) => ({ id })),
    });
    const contactIds = res.results
      .flatMap((r) => r.to?.map((t) => t.id) || []);

    if (contactIds.length) {
      const contactRes = await client.crm.contacts.batchApi.read({
        inputs: [...new Set(contactIds)].map((id) => ({ id })),
        properties: CONTACT_PROPS,
      });
      contacts.push(...contactRes.results);
    }
  }

  return contacts;
}

async function fetchPipelines() {
  const client = getClient();
  const res = await client.crm.pipelines.pipelinesApi.getAll('deals');
  return res.results.map((p) => ({ id: p.id, label: p.label }));
}

async function fetchPipelineStages(pipelineId) {
  const client = getClient();
  const pipelines = await client.crm.pipelines.pipelinesApi.getAll('deals');
  const pipeline = pipelines.results.find((p) => p.id === pipelineId) || pipelines.results[0];
  if (!pipeline) return [];
  const stages = await client.crm.pipelines.pipelineStagesApi.getAll('deals', pipeline.id);
  return stages.results.map((s) => ({
    id: s.id,
    label: s.label,
    probability: parseFloat(s.metadata?.probability || 0),
    displayOrder: s.displayOrder,
  })).sort((a, b) => a.displayOrder - b.displayOrder);
}

async function fetchOwners() {
  const client = getClient();
  const res = await client.crm.owners.ownersApi.getPage();
  return res.results.map((o) => ({
    id: o.id,
    name: `${o.firstName || ''} ${o.lastName || ''}`.trim() || o.email,
    email: o.email,
  }));
}

module.exports = {
  fetchAllDeals,
  fetchContactsForDeals,
  fetchPipelines,
  fetchPipelineStages,
  fetchOwners,
};
