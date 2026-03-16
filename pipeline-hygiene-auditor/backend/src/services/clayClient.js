/**
 * Clay Integration Client
 *
 * Connects to Clay's API to:
 *   1. Check enrichment completeness for contacts / companies
 *   2. Pull enrichment data to cross-reference with HubSpot records
 *   3. Trigger Clay table runs for new leads that need enrichment
 *
 * Requires CLAY_API_KEY and optionally CLAY_TABLE_ID.
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

const CLAY_BASE = 'https://api.clay.com/v1';

function getHeaders() {
  const key = process.env.CLAY_API_KEY;
  if (!key) throw new Error('CLAY_API_KEY is required');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch enrichment rows from a Clay table.
 * Returns an array of enriched records with their completeness scores.
 */
async function fetchEnrichedRecords(tableId) {
  const id = tableId || process.env.CLAY_TABLE_ID;
  if (!id) return [];

  try {
    const res = await axios.get(`${CLAY_BASE}/tables/${id}/rows`, {
      headers: getHeaders(),
      params: { limit: 500 },
    });

    return (res.data?.rows || []).map((row) => ({
      id: row.id,
      email: row.fields?.email || row.fields?.Email || null,
      company: row.fields?.company || row.fields?.Company || null,
      domain: row.fields?.domain || row.fields?.Domain || null,
      enrichedFields: row.fields || {},
      completeness: computeCompleteness(row.fields || {}),
    }));
  } catch (err) {
    logger.error('Clay fetch error', { error: err.message });
    return [];
  }
}

/**
 * Look up a single contact/company in Clay by email or domain.
 */
async function lookupEnrichment(email, domain) {
  try {
    const params = {};
    if (email) params.email = email;
    if (domain) params.domain = domain;

    const res = await axios.get(`${CLAY_BASE}/enrich`, {
      headers: getHeaders(),
      params,
    });
    return res.data || null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    logger.error('Clay lookup error', { error: err.message });
    return null;
  }
}

/**
 * Trigger a Clay table run for a batch of records that need enrichment.
 * Used to backfill data for contacts found in HubSpot but missing from Clay.
 */
async function triggerEnrichmentRun(tableId, records) {
  const id = tableId || process.env.CLAY_TABLE_ID;
  if (!id || !records.length) return null;

  try {
    const res = await axios.post(`${CLAY_BASE}/tables/${id}/runs`, {
      rows: records.map((r) => ({
        fields: { email: r.email, company: r.company, domain: r.domain },
      })),
    }, { headers: getHeaders() });

    logger.info(`Clay enrichment run triggered for ${records.length} records`);
    return res.data;
  } catch (err) {
    logger.error('Clay trigger error', { error: err.message });
    return null;
  }
}

/**
 * Compute a completeness score (0-100) based on how many key enrichment
 * fields are populated in a Clay row.
 */
function computeCompleteness(fields) {
  const keyFields = [
    'email', 'Email',
    'first_name', 'firstName', 'First Name',
    'last_name', 'lastName', 'Last Name',
    'title', 'jobTitle', 'Job Title',
    'company', 'Company',
    'domain', 'Domain',
    'phone', 'Phone',
    'linkedin_url', 'LinkedIn URL', 'linkedinUrl',
    'city', 'City',
    'country', 'Country',
    'industry', 'Industry',
    'employee_count', 'employeeCount', 'Employees',
    'revenue', 'Revenue', 'annual_revenue',
  ];

  // Deduplicate by logical field (take first match)
  const logicalFields = [
    ['email', 'Email'],
    ['first_name', 'firstName', 'First Name'],
    ['last_name', 'lastName', 'Last Name'],
    ['title', 'jobTitle', 'Job Title'],
    ['company', 'Company'],
    ['domain', 'Domain'],
    ['phone', 'Phone'],
    ['linkedin_url', 'LinkedIn URL', 'linkedinUrl'],
    ['city', 'City'],
    ['country', 'Country'],
    ['industry', 'Industry'],
    ['employee_count', 'employeeCount', 'Employees'],
    ['revenue', 'Revenue', 'annual_revenue'],
  ];

  let filled = 0;
  for (const aliases of logicalFields) {
    if (aliases.some((a) => fields[a] != null && fields[a] !== '')) {
      filled++;
    }
  }

  return Math.round((filled / logicalFields.length) * 100);
}

/**
 * Cross-reference HubSpot contacts with Clay enrichment data.
 * Returns a map of email → { enriched, completeness, missingFields }.
 */
function crossReferenceEnrichment(hubspotContacts, clayRecords) {
  const clayByEmail = {};
  clayRecords.forEach((r) => {
    if (r.email) clayByEmail[r.email.toLowerCase()] = r;
  });

  return hubspotContacts.map((contact) => {
    const email = (contact.properties?.email || '').toLowerCase();
    const clayRecord = email ? clayByEmail[email] : null;

    const missingInHubSpot = [];
    const props = contact.properties || {};
    if (!props.phone) missingInHubSpot.push('phone');
    if (!props.jobtitle) missingInHubSpot.push('jobtitle');
    if (!props.company) missingInHubSpot.push('company');
    if (!props.city && !props.state) missingInHubSpot.push('location');
    if (!props.linkedin_url) missingInHubSpot.push('linkedin');

    return {
      contactId: contact.id,
      email,
      name: `${props.firstname || ''} ${props.lastname || ''}`.trim(),
      enrichedInClay: !!clayRecord,
      clayCompleteness: clayRecord?.completeness || 0,
      missingInHubSpot,
      hubSpotCompleteness: Math.round(
        ((Object.values(props).filter((v) => v != null && v !== '').length) /
          Math.max(Object.keys(props).length, 1)) * 100
      ),
    };
  });
}

module.exports = {
  fetchEnrichedRecords,
  lookupEnrichment,
  triggerEnrichmentRun,
  computeCompleteness,
  crossReferenceEnrichment,
};
