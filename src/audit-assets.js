export async function auditPipelines(client) {
  const results = {};
  const pipelineObjects = ['deals', 'tickets'];

  for (const objectType of pipelineObjects) {
    try {
      const response = await client.crm.pipelines.pipelinesApi.getAll(objectType);
      results[objectType] = (response.results || []).map(p => ({
        id: p.id,
        label: p.label,
        displayOrder: p.displayOrder,
        stages: (p.stages || []).map(s => ({
          id: s.id,
          label: s.label,
          displayOrder: s.displayOrder,
          metadata: s.metadata,
        })),
      }));
    } catch (err) {
      results[objectType] = { error: err.message };
    }
  }

  return results;
}

export async function auditForms(client) {
  try {
    const response = await client.apiRequest({
      method: 'GET',
      path: '/marketing/v3/forms',
      qs: { limit: 100 },
    });
    const body = await response.json();
    const forms = body.results || [];
    return {
      total: forms.length,
      forms: forms.map(f => ({
        id: f.id,
        name: f.name,
        formType: f.formType,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        archived: f.archived || false,
        fieldCount: f.fieldGroups?.reduce((acc, g) => acc + (g.fields?.length || 0), 0) || 0,
      })),
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function auditLists(client) {
  try {
    const response = await client.apiRequest({
      method: 'GET',
      path: '/crm/v3/lists',
      qs: { count: 250 },
    });
    const body = await response.json();
    const lists = body.lists || [];
    const active = lists.filter(l => l.processingType === 'DYNAMIC');
    const staticLists = lists.filter(l => l.processingType === 'MANUAL' || l.processingType === 'STATIC');
    return {
      total: lists.length,
      dynamic: active.length,
      static: staticLists.length,
      lists: lists.map(l => ({
        listId: l.listId,
        name: l.name,
        processingType: l.processingType,
        objectTypeId: l.objectTypeId,
        size: l.size || 0,
        updatedAt: l.updatedAt,
      })),
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function auditEmailMarketing(client) {
  try {
    const response = await client.apiRequest({
      method: 'GET',
      path: '/marketing-emails/v1/emails',
      qs: { limit: 100, orderBy: '-updated' },
    });
    const body = await response.json();
    const emails = body.objects || [];
    return {
      total: body.total || emails.length,
      emails: emails.slice(0, 50).map(e => ({
        id: e.id,
        name: e.name,
        subject: e.subject,
        state: e.state,
        type: e.emailType,
        publishDate: e.publishDate,
        updated: e.updated,
        stats: e.stats || {},
      })),
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function auditOwners(client) {
  try {
    const response = await client.crm.owners.ownersApi.getPage();
    const owners = response.results || [];
    return {
      total: owners.length,
      owners: owners.map(o => ({
        id: o.id,
        email: o.email,
        firstName: o.firstName,
        lastName: o.lastName,
        teams: o.teams || [],
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function auditAssociations(client) {
  const associationTypes = [
    { from: 'contacts', to: 'companies' },
    { from: 'deals', to: 'contacts' },
    { from: 'deals', to: 'companies' },
    { from: 'tickets', to: 'contacts' },
    { from: 'tickets', to: 'companies' },
  ];

  const results = {};
  for (const { from, to } of associationTypes) {
    const key = `${from}_to_${to}`;
    try {
      const response = await client.apiRequest({
        method: 'GET',
        path: `/crm/v4/associations/${from}/${to}/labels`,
      });
      const body = await response.json();
      results[key] = {
        labels: (body.results || []).map(r => ({
          category: r.category,
          typeId: r.typeId,
          label: r.label,
        })),
      };
    } catch (err) {
      results[key] = { error: err.message };
    }
  }
  return results;
}

export async function auditPortalInfo(client) {
  try {
    const response = await client.apiRequest({
      method: 'GET',
      path: '/account-info/v3/details',
    });
    const body = await response.json();
    return {
      portalId: body.portalId,
      accountType: body.accountType,
      timeZone: body.timeZone,
      currency: body.currency,
      utcOffset: body.utcOffset,
      companyCurrency: body.companyCurrency,
      additionalCurrencies: body.additionalCurrencies || [],
      uiDomain: body.uiDomain,
    };
  } catch (err) {
    return { error: err.message };
  }
}
