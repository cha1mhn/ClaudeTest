export async function auditWorkflows(client) {
  const results = { active: [], inactive: [], summary: {} };

  try {
    const workflows = await fetchAllWorkflows(client);

    for (const wf of workflows) {
      const entry = {
        id: wf.id,
        name: wf.name,
        type: wf.type,
        enabled: wf.enabled,
        insertedAt: wf.insertedAt,
        updatedAt: wf.updatedAt,
        contactListId: wf.contactListId,
        enrollmentCriteria: summarizeEnrollment(wf),
        actionCount: countActions(wf),
      };

      if (wf.enabled) {
        results.active.push(entry);
      } else {
        results.inactive.push(entry);
      }
    }

    results.summary = {
      total: workflows.length,
      active: results.active.length,
      inactive: results.inactive.length,
      byType: countByType(workflows),
    };
  } catch (err) {
    results.error = err.message;
    // Try the v4 automation API as fallback
    try {
      const v4Results = await fetchWorkflowsV4(client);
      return v4Results;
    } catch (err2) {
      results.fallbackError = err2.message;
    }
  }

  return results;
}

async function fetchAllWorkflows(client) {
  // Use the automation API (v3)
  const response = await client.apiRequest({
    method: 'GET',
    path: '/automation/v3/workflows',
  });
  const body = await response.json();
  return body.workflows || [];
}

async function fetchWorkflowsV4(client) {
  const results = { active: [], inactive: [], summary: {} };

  // Try v4 automation endpoint
  const response = await client.apiRequest({
    method: 'GET',
    path: '/automation/v4/flows',
    qs: { limit: 500 },
  });
  const body = await response.json();
  const flows = body.results || [];

  for (const flow of flows) {
    const entry = {
      id: flow.id,
      name: flow.name,
      type: flow.type || 'unknown',
      enabled: flow.enabled || false,
      insertedAt: flow.createdAt,
      updatedAt: flow.updatedAt,
      actionCount: flow.actions?.length || 0,
    };
    if (flow.enabled) {
      results.active.push(entry);
    } else {
      results.inactive.push(entry);
    }
  }

  results.summary = {
    total: flows.length,
    active: results.active.length,
    inactive: results.inactive.length,
  };

  return results;
}

function summarizeEnrollment(wf) {
  if (!wf.enrollmentCriteria) return 'None';
  const listIds = wf.enrollmentCriteria?.listFilterBranch?.filterBranches?.length || 0;
  return `${listIds} filter branch(es)`;
}

function countActions(wf) {
  if (!wf.actions) return 0;
  return wf.actions.length;
}

function countByType(workflows) {
  const types = {};
  for (const wf of workflows) {
    const t = wf.type || 'unknown';
    types[t] = (types[t] || 0) + 1;
  }
  return types;
}
