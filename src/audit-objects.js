const CORE_OBJECTS = ['contacts', 'companies', 'deals', 'tickets', 'line_items', 'products', 'quotes'];

export async function auditObjects(client) {
  const results = {};

  for (const objectType of CORE_OBJECTS) {
    try {
      const properties = await fetchProperties(client, objectType);
      const recordCount = await fetchRecordCount(client, objectType);
      results[objectType] = {
        recordCount,
        propertyCount: properties.length,
        properties: categorizeProperties(properties),
        customProperties: properties.filter(p => !p.hubspotDefined),
        hubspotProperties: properties.filter(p => p.hubspotDefined),
      };
    } catch (err) {
      results[objectType] = { error: err.message };
    }
  }

  // Fetch custom objects
  try {
    const customObjects = await fetchCustomObjects(client);
    for (const schema of customObjects) {
      const objectType = schema.objectTypeId || schema.name;
      try {
        const properties = await fetchProperties(client, objectType);
        const recordCount = await fetchRecordCount(client, objectType);
        results[`custom:${schema.name}`] = {
          label: schema.labels?.singular || schema.name,
          recordCount,
          propertyCount: properties.length,
          properties: categorizeProperties(properties),
          customProperties: properties.filter(p => !p.hubspotDefined),
          hubspotProperties: properties.filter(p => p.hubspotDefined),
          isCustomObject: true,
        };
      } catch (err) {
        results[`custom:${schema.name}`] = { label: schema.name, error: err.message, isCustomObject: true };
      }
    }
  } catch (err) {
    results._customObjectsError = err.message;
  }

  return results;
}

async function fetchProperties(client, objectType) {
  const response = await client.crm.properties.coreApi.getAll(objectType);
  return response.results || [];
}

async function fetchRecordCount(client, objectType) {
  try {
    const searchRequest = { filterGroups: [], limit: 1 };
    const response = await client.crm.objects.searchApi.doSearch(objectType, searchRequest);
    return response.total || 0;
  } catch {
    // Some objects don't support search - try basic list
    try {
      const response = await client.crm.objects.basicApi.getPage(objectType, 1);
      return response.total || 0;
    } catch {
      return 'N/A';
    }
  }
}

async function fetchCustomObjects(client) {
  try {
    const response = await client.crm.schemas.coreApi.getAll();
    return response.results || [];
  } catch {
    return [];
  }
}

function categorizeProperties(properties) {
  const categories = {};
  for (const prop of properties) {
    const group = prop.groupName || 'ungrouped';
    if (!categories[group]) categories[group] = [];
    categories[group].push({
      name: prop.name,
      label: prop.label,
      type: prop.type,
      fieldType: prop.fieldType,
      hubspotDefined: prop.hubspotDefined || false,
      hasOptions: (prop.options?.length || 0) > 0,
      description: prop.description || '',
    });
  }
  return categories;
}
