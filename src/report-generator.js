import PptxGenJS from 'pptxgenjs';

const COLORS = {
  primary: '2E475D',     // HubSpot dark blue
  secondary: 'FF7A59',   // HubSpot orange
  accent: '00BDA5',      // HubSpot teal
  lightBg: 'F5F8FA',
  white: 'FFFFFF',
  darkText: '33475B',
  lightText: '516F90',
  success: '00BDA5',
  warning: 'DBAE60',
  error: 'F2545B',
  tableHeader: '2E475D',
  tableRow1: 'FFFFFF',
  tableRow2: 'F5F8FA',
};

export async function generateReport(auditData, outputPath) {
  const pptx = new PptxGenJS();

  pptx.author = 'HubSpot Portal Audit Tool';
  pptx.company = 'Portal Audit';
  pptx.subject = `HubSpot Portal Audit - ${auditData.portalInfo?.portalId || 'Unknown'}`;
  pptx.title = `HubSpot Portal Audit Report`;

  pptx.defineSlideMaster({
    title: 'AUDIT_MASTER',
    background: { color: COLORS.white },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.6, fill: { color: COLORS.primary } } },
      { text: { text: 'HubSpot Portal Audit', options: { x: 0.5, y: 0.1, w: 5, h: 0.4, fontSize: 14, color: COLORS.white, fontFace: 'Arial', bold: true } } },
      { rect: { x: 0, y: '95%', w: '100%', h: '5%', fill: { color: COLORS.lightBg } } },
    ],
  });

  addTitleSlide(pptx, auditData);
  addExecutiveSummary(pptx, auditData);
  addPortalInfoSlide(pptx, auditData);
  addObjectSummarySlide(pptx, auditData);
  addObjectDetailSlides(pptx, auditData);
  addWorkflowSummarySlide(pptx, auditData);
  addWorkflowDetailSlides(pptx, auditData);
  addPipelineSlides(pptx, auditData);
  addFormsSlide(pptx, auditData);
  addListsSlide(pptx, auditData);
  addEmailSlide(pptx, auditData);
  addOwnersSlide(pptx, auditData);
  addAssociationsSlide(pptx, auditData);
  addRecommendationsSlide(pptx, auditData);

  await pptx.writeFile({ fileName: outputPath });
  return outputPath;
}

function addTitleSlide(pptx, data) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.primary };

  slide.addText('HubSpot Portal Audit', {
    x: 0.5, y: 1.5, w: 9, h: 1.2,
    fontSize: 36, color: COLORS.white, fontFace: 'Arial', bold: true, align: 'center',
  });

  const portalId = data.portalInfo?.portalId || 'N/A';
  slide.addText(`Portal ID: ${portalId}`, {
    x: 0.5, y: 2.7, w: 9, h: 0.6,
    fontSize: 20, color: COLORS.secondary, fontFace: 'Arial', align: 'center',
  });

  slide.addText(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: 0.5, y: 3.5, w: 9, h: 0.5,
    fontSize: 14, color: COLORS.white, fontFace: 'Arial', align: 'center', italic: true,
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 3.5, y: 3.2, w: 3, h: 0.03, fill: { color: COLORS.secondary },
  });
}

function addExecutiveSummary(pptx, data) {
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('Executive Summary', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  const objects = data.objects || {};
  const workflows = data.workflows || {};
  const pipelines = data.pipelines || {};
  const forms = data.forms || {};
  const lists = data.lists || {};

  const objectTypes = Object.keys(objects).filter(k => !k.startsWith('_'));
  const totalRecords = objectTypes.reduce((sum, key) => sum + (typeof objects[key]?.recordCount === 'number' ? objects[key].recordCount : 0), 0);
  const totalProperties = objectTypes.reduce((sum, key) => sum + (objects[key]?.propertyCount || 0), 0);
  const totalCustomProps = objectTypes.reduce((sum, key) => sum + (objects[key]?.customProperties?.length || 0), 0);

  const metrics = [
    { label: 'Object Types', value: objectTypes.length, color: COLORS.primary },
    { label: 'Total Records', value: totalRecords.toLocaleString(), color: COLORS.secondary },
    { label: 'Properties', value: totalProperties, color: COLORS.accent },
    { label: 'Custom Properties', value: totalCustomProps, color: COLORS.primary },
    { label: 'Active Workflows', value: workflows.summary?.active || 0, color: COLORS.success },
    { label: 'Inactive Workflows', value: workflows.summary?.inactive || 0, color: COLORS.warning },
    { label: 'Pipelines', value: countPipelines(pipelines), color: COLORS.primary },
    { label: 'Forms', value: forms.total || 0, color: COLORS.secondary },
  ];

  const cols = 4;
  const cardW = 2.1;
  const cardH = 1.1;
  const startX = 0.5;
  const startY = 1.5;
  const gapX = 0.2;
  const gapY = 0.2;

  metrics.forEach((m, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: cardW, h: cardH,
      fill: { color: COLORS.lightBg },
      rectRadius: 0.1,
    });

    slide.addText(String(m.value), {
      x, y: y + 0.1, w: cardW, h: 0.55,
      fontSize: 24, color: m.color, fontFace: 'Arial', bold: true, align: 'center',
    });

    slide.addText(m.label, {
      x, y: y + 0.6, w: cardW, h: 0.35,
      fontSize: 10, color: COLORS.lightText, fontFace: 'Arial', align: 'center',
    });
  });
}

function addPortalInfoSlide(pptx, data) {
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('Portal Information', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  const info = data.portalInfo || {};
  if (info.error) {
    slide.addText(`Error fetching portal info: ${info.error}`, {
      x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 12, color: COLORS.error, fontFace: 'Arial',
    });
    return;
  }

  const rows = [
    ['Portal ID', String(info.portalId || 'N/A')],
    ['Account Type', info.accountType || 'N/A'],
    ['Time Zone', info.timeZone || 'N/A'],
    ['Currency', info.currency || 'N/A'],
    ['UI Domain', info.uiDomain || 'N/A'],
    ['Additional Currencies', (info.additionalCurrencies || []).join(', ') || 'None'],
  ];

  const tableRows = rows.map(([key, val]) => [
    { text: key, options: { bold: true, fontSize: 11, color: COLORS.darkText, fill: { color: COLORS.lightBg } } },
    { text: val, options: { fontSize: 11, color: COLORS.darkText } },
  ]);

  slide.addTable(tableRows, {
    x: 0.5, y: 1.4, w: 9, colW: [3, 6],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.4,
  });
}

function addObjectSummarySlide(pptx, data) {
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('CRM Objects Overview', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  const objects = data.objects || {};
  const headerRow = [
    { text: 'Object', options: { bold: true, fontSize: 10, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
    { text: 'Records', options: { bold: true, fontSize: 10, color: COLORS.white, fill: { color: COLORS.tableHeader }, align: 'right' } },
    { text: 'Properties', options: { bold: true, fontSize: 10, color: COLORS.white, fill: { color: COLORS.tableHeader }, align: 'right' } },
    { text: 'Custom Props', options: { bold: true, fontSize: 10, color: COLORS.white, fill: { color: COLORS.tableHeader }, align: 'right' } },
    { text: 'HubSpot Props', options: { bold: true, fontSize: 10, color: COLORS.white, fill: { color: COLORS.tableHeader }, align: 'right' } },
  ];

  const dataRows = Object.entries(objects)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, val], i) => {
      const fill = { color: i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2 };
      const label = val.isCustomObject ? `${val.label || key} (Custom)` : key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
      if (val.error) {
        return [
          { text: label, options: { fontSize: 10, fill } },
          { text: 'Error', options: { fontSize: 10, color: COLORS.error, fill, align: 'right' } },
          { text: '-', options: { fontSize: 10, fill, align: 'right' } },
          { text: '-', options: { fontSize: 10, fill, align: 'right' } },
          { text: '-', options: { fontSize: 10, fill, align: 'right' } },
        ];
      }
      return [
        { text: label, options: { fontSize: 10, fill } },
        { text: String(val.recordCount ?? 'N/A'), options: { fontSize: 10, fill, align: 'right' } },
        { text: String(val.propertyCount || 0), options: { fontSize: 10, fill, align: 'right' } },
        { text: String(val.customProperties?.length || 0), options: { fontSize: 10, fill, align: 'right' } },
        { text: String(val.hubspotProperties?.length || 0), options: { fontSize: 10, fill, align: 'right' } },
      ];
    });

  slide.addTable([headerRow, ...dataRows], {
    x: 0.5, y: 1.4, w: 9, colW: [2.5, 1.5, 1.5, 1.75, 1.75],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.35,
  });
}

function addObjectDetailSlides(pptx, data) {
  const objects = data.objects || {};

  for (const [objectType, objData] of Object.entries(objects)) {
    if (objectType.startsWith('_') || objData.error) continue;

    const label = objData.isCustomObject
      ? `${objData.label || objectType} (Custom Object)`
      : objectType.charAt(0).toUpperCase() + objectType.slice(1).replace('_', ' ');

    const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
    slide.addText(`${label} - Property Details`, {
      x: 0.5, y: 0.7, w: 9, h: 0.5,
      fontSize: 20, color: COLORS.primary, fontFace: 'Arial', bold: true,
    });

    // Property group summary
    const groups = objData.properties || {};
    const groupEntries = Object.entries(groups);

    if (groupEntries.length === 0) {
      slide.addText('No properties found.', {
        x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 12, color: COLORS.lightText, fontFace: 'Arial',
      });
      continue;
    }

    const headerRow = [
      { text: 'Property Group', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
      { text: 'Count', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader }, align: 'right' } },
      { text: 'Custom', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader }, align: 'right' } },
      { text: 'Types', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
    ];

    const dataRows = groupEntries.slice(0, 15).map(([group, props], i) => {
      const fill = { color: i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2 };
      const customCount = props.filter(p => !p.hubspotDefined).length;
      const types = [...new Set(props.map(p => p.type))].join(', ');
      return [
        { text: group, options: { fontSize: 9, fill } },
        { text: String(props.length), options: { fontSize: 9, fill, align: 'right' } },
        { text: String(customCount), options: { fontSize: 9, fill, align: 'right' } },
        { text: types, options: { fontSize: 8, fill } },
      ];
    });

    slide.addTable([headerRow, ...dataRows], {
      x: 0.5, y: 1.3, w: 9, colW: [3, 1.2, 1.2, 3.6],
      border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
      rowH: 0.3,
      autoPage: true,
    });
  }
}

function addWorkflowSummarySlide(pptx, data) {
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('Workflows Overview', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  const wf = data.workflows || {};
  if (wf.error) {
    slide.addText(`Error fetching workflows: ${wf.error}`, {
      x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 12, color: COLORS.error, fontFace: 'Arial',
    });
    return;
  }

  const summary = wf.summary || {};

  // Summary cards
  const cards = [
    { label: 'Total Workflows', value: summary.total || 0, color: COLORS.primary },
    { label: 'Active', value: summary.active || 0, color: COLORS.success },
    { label: 'Inactive', value: summary.inactive || 0, color: COLORS.warning },
  ];

  cards.forEach((card, i) => {
    const x = 0.5 + i * 3.1;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.4, w: 2.8, h: 1,
      fill: { color: COLORS.lightBg }, rectRadius: 0.1,
    });
    slide.addText(String(card.value), {
      x, y: 1.45, w: 2.8, h: 0.55,
      fontSize: 28, color: card.color, fontFace: 'Arial', bold: true, align: 'center',
    });
    slide.addText(card.label, {
      x, y: 1.95, w: 2.8, h: 0.35,
      fontSize: 11, color: COLORS.lightText, fontFace: 'Arial', align: 'center',
    });
  });

  // Type breakdown
  const byType = summary.byType || {};
  if (Object.keys(byType).length > 0) {
    slide.addText('By Type:', {
      x: 0.5, y: 2.7, w: 9, h: 0.4,
      fontSize: 14, color: COLORS.darkText, fontFace: 'Arial', bold: true,
    });

    const typeRows = Object.entries(byType).map(([type, count], i) => {
      const fill = { color: i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2 };
      return [
        { text: type, options: { fontSize: 10, fill } },
        { text: String(count), options: { fontSize: 10, fill, align: 'right' } },
      ];
    });

    slide.addTable(typeRows, {
      x: 0.5, y: 3.1, w: 5, colW: [3.5, 1.5],
      border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
      rowH: 0.3,
    });
  }
}

function addWorkflowDetailSlides(pptx, data) {
  const wf = data.workflows || {};

  for (const [status, label] of [['active', 'Active Workflows'], ['inactive', 'Inactive Workflows']]) {
    const workflows = wf[status] || [];
    if (workflows.length === 0) continue;

    // Paginate: 12 workflows per slide
    const perPage = 12;
    for (let page = 0; page < workflows.length; page += perPage) {
      const slice = workflows.slice(page, page + perPage);
      const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
      const pageLabel = workflows.length > perPage ? ` (${page + 1}-${Math.min(page + perPage, workflows.length)} of ${workflows.length})` : '';

      slide.addText(`${label}${pageLabel}`, {
        x: 0.5, y: 0.7, w: 9, h: 0.5,
        fontSize: 20, color: COLORS.primary, fontFace: 'Arial', bold: true,
      });

      const headerRow = [
        { text: 'Name', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
        { text: 'Type', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
        { text: 'Actions', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader }, align: 'right' } },
        { text: 'Last Updated', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
      ];

      const dataRows = slice.map((w, i) => {
        const fill = { color: i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2 };
        return [
          { text: (w.name || 'Unnamed').substring(0, 40), options: { fontSize: 9, fill } },
          { text: w.type || 'N/A', options: { fontSize: 9, fill } },
          { text: String(w.actionCount || 0), options: { fontSize: 9, fill, align: 'right' } },
          { text: w.updatedAt ? new Date(w.updatedAt).toLocaleDateString() : 'N/A', options: { fontSize: 9, fill } },
        ];
      });

      slide.addTable([headerRow, ...dataRows], {
        x: 0.5, y: 1.3, w: 9, colW: [4, 1.8, 1, 2.2],
        border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
        rowH: 0.3,
      });
    }
  }
}

function addPipelineSlides(pptx, data) {
  const pipelines = data.pipelines || {};

  for (const [objectType, pipelineList] of Object.entries(pipelines)) {
    if (pipelineList.error || !Array.isArray(pipelineList)) continue;

    const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
    slide.addText(`${objectType.charAt(0).toUpperCase() + objectType.slice(1)} Pipelines`, {
      x: 0.5, y: 0.7, w: 9, h: 0.5,
      fontSize: 20, color: COLORS.primary, fontFace: 'Arial', bold: true,
    });

    let yPos = 1.4;
    for (const pipeline of pipelineList.slice(0, 4)) {
      slide.addText(pipeline.label || 'Unnamed Pipeline', {
        x: 0.5, y: yPos, w: 9, h: 0.35,
        fontSize: 13, color: COLORS.secondary, fontFace: 'Arial', bold: true,
      });
      yPos += 0.35;

      if (pipeline.stages?.length) {
        const stageRows = pipeline.stages.map((s, i) => {
          const fill = { color: i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2 };
          return [
            { text: String(s.displayOrder ?? i), options: { fontSize: 9, fill, align: 'center' } },
            { text: s.label || 'Unnamed', options: { fontSize: 9, fill } },
            { text: s.metadata?.probability ? `${(s.metadata.probability * 100).toFixed(0)}%` : '-', options: { fontSize: 9, fill, align: 'right' } },
          ];
        });

        slide.addTable(stageRows, {
          x: 0.7, y: yPos, w: 8.3, colW: [1, 5.3, 2],
          border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
          rowH: 0.25,
        });
        yPos += stageRows.length * 0.25 + 0.2;
      }
    }
  }
}

function addFormsSlide(pptx, data) {
  const forms = data.forms || {};
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('Forms', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  if (forms.error) {
    slide.addText(`Error: ${forms.error}`, {
      x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 12, color: COLORS.error, fontFace: 'Arial',
    });
    return;
  }

  slide.addText(`Total Forms: ${forms.total || 0}`, {
    x: 0.5, y: 1.3, w: 9, h: 0.4,
    fontSize: 14, color: COLORS.darkText, fontFace: 'Arial', bold: true,
  });

  const formList = forms.forms || [];
  if (formList.length === 0) return;

  const headerRow = [
    { text: 'Name', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
    { text: 'Type', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
    { text: 'Fields', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader }, align: 'right' } },
    { text: 'Updated', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
  ];

  const dataRows = formList.slice(0, 15).map((f, i) => {
    const fill = { color: i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2 };
    return [
      { text: (f.name || 'Unnamed').substring(0, 35), options: { fontSize: 9, fill } },
      { text: f.formType || 'N/A', options: { fontSize: 9, fill } },
      { text: String(f.fieldCount || 0), options: { fontSize: 9, fill, align: 'right' } },
      { text: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : 'N/A', options: { fontSize: 9, fill } },
    ];
  });

  slide.addTable([headerRow, ...dataRows], {
    x: 0.5, y: 1.8, w: 9, colW: [3.5, 2, 1.5, 2],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.3,
  });
}

function addListsSlide(pptx, data) {
  const lists = data.lists || {};
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('Lists', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  if (lists.error) {
    slide.addText(`Error: ${lists.error}`, {
      x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 12, color: COLORS.error, fontFace: 'Arial',
    });
    return;
  }

  const cards = [
    { label: 'Total', value: lists.total || 0, color: COLORS.primary },
    { label: 'Dynamic (Active)', value: lists.dynamic || 0, color: COLORS.success },
    { label: 'Static', value: lists.static || 0, color: COLORS.lightText },
  ];

  cards.forEach((card, i) => {
    const x = 0.5 + i * 3.1;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.4, w: 2.8, h: 0.9,
      fill: { color: COLORS.lightBg }, rectRadius: 0.1,
    });
    slide.addText(String(card.value), {
      x, y: 1.45, w: 2.8, h: 0.5,
      fontSize: 24, color: card.color, fontFace: 'Arial', bold: true, align: 'center',
    });
    slide.addText(card.label, {
      x, y: 1.85, w: 2.8, h: 0.35,
      fontSize: 11, color: COLORS.lightText, fontFace: 'Arial', align: 'center',
    });
  });

  const listItems = lists.lists || [];
  if (listItems.length > 0) {
    const headerRow = [
      { text: 'Name', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
      { text: 'Type', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
      { text: 'Size', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader }, align: 'right' } },
    ];

    const dataRows = listItems.slice(0, 12).map((l, i) => {
      const fill = { color: i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2 };
      return [
        { text: (l.name || 'Unnamed').substring(0, 40), options: { fontSize: 9, fill } },
        { text: l.processingType || 'N/A', options: { fontSize: 9, fill } },
        { text: String(l.size || 0), options: { fontSize: 9, fill, align: 'right' } },
      ];
    });

    slide.addTable([headerRow, ...dataRows], {
      x: 0.5, y: 2.6, w: 9, colW: [5, 2, 2],
      border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
      rowH: 0.28,
    });
  }
}

function addEmailSlide(pptx, data) {
  const emails = data.emails || {};
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('Marketing Emails', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  if (emails.error) {
    slide.addText(`Error: ${emails.error}`, {
      x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 12, color: COLORS.error, fontFace: 'Arial',
    });
    return;
  }

  slide.addText(`Total Emails: ${emails.total || 0}`, {
    x: 0.5, y: 1.3, w: 9, h: 0.4,
    fontSize: 14, color: COLORS.darkText, fontFace: 'Arial', bold: true,
  });

  const emailList = emails.emails || [];
  if (emailList.length === 0) return;

  const headerRow = [
    { text: 'Name', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
    { text: 'Subject', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
    { text: 'State', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
    { text: 'Type', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
  ];

  const dataRows = emailList.slice(0, 12).map((e, i) => {
    const fill = { color: i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2 };
    return [
      { text: (e.name || 'Unnamed').substring(0, 30), options: { fontSize: 9, fill } },
      { text: (e.subject || '').substring(0, 30), options: { fontSize: 9, fill } },
      { text: e.state || 'N/A', options: { fontSize: 9, fill } },
      { text: e.type || 'N/A', options: { fontSize: 9, fill } },
    ];
  });

  slide.addTable([headerRow, ...dataRows], {
    x: 0.5, y: 1.8, w: 9, colW: [3, 3, 1.5, 1.5],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.28,
  });
}

function addOwnersSlide(pptx, data) {
  const owners = data.owners || {};
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('Owners / Users', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  if (owners.error) {
    slide.addText(`Error: ${owners.error}`, {
      x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 12, color: COLORS.error, fontFace: 'Arial',
    });
    return;
  }

  slide.addText(`Total Owners: ${owners.total || 0}`, {
    x: 0.5, y: 1.3, w: 9, h: 0.4,
    fontSize: 14, color: COLORS.darkText, fontFace: 'Arial', bold: true,
  });

  const ownerList = owners.owners || [];
  if (ownerList.length === 0) return;

  const headerRow = [
    { text: 'Name', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
    { text: 'Email', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
    { text: 'Teams', options: { bold: true, fontSize: 9, color: COLORS.white, fill: { color: COLORS.tableHeader } } },
  ];

  const dataRows = ownerList.slice(0, 15).map((o, i) => {
    const fill = { color: i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2 };
    const name = `${o.firstName || ''} ${o.lastName || ''}`.trim() || 'N/A';
    const teams = (o.teams || []).map(t => t.name).join(', ') || 'None';
    return [
      { text: name, options: { fontSize: 9, fill } },
      { text: o.email || 'N/A', options: { fontSize: 9, fill } },
      { text: teams, options: { fontSize: 9, fill } },
    ];
  });

  slide.addTable([headerRow, ...dataRows], {
    x: 0.5, y: 1.8, w: 9, colW: [3, 3.5, 2.5],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.28,
  });
}

function addAssociationsSlide(pptx, data) {
  const assoc = data.associations || {};
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('Association Labels', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  const entries = Object.entries(assoc);
  if (entries.length === 0) {
    slide.addText('No association data available.', {
      x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 12, color: COLORS.lightText, fontFace: 'Arial',
    });
    return;
  }

  let yPos = 1.4;
  for (const [key, val] of entries) {
    const label = key.replace(/_/g, ' ').replace(/to/g, ' -> ');
    if (val.error) {
      slide.addText(`${label}: Error - ${val.error}`, {
        x: 0.5, y: yPos, w: 9, h: 0.3, fontSize: 10, color: COLORS.error, fontFace: 'Arial',
      });
    } else {
      const labelCount = val.labels?.length || 0;
      const labelNames = val.labels?.map(l => l.label || `Type ${l.typeId}`).join(', ') || 'Default only';
      slide.addText(`${label}: ${labelCount} label(s) - ${labelNames}`, {
        x: 0.5, y: yPos, w: 9, h: 0.3, fontSize: 10, color: COLORS.darkText, fontFace: 'Arial',
      });
    }
    yPos += 0.35;
  }
}

function addRecommendationsSlide(pptx, data) {
  const slide = pptx.addSlide({ masterName: 'AUDIT_MASTER' });
  slide.addText('Audit Observations', {
    x: 0.5, y: 0.7, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.primary, fontFace: 'Arial', bold: true,
  });

  const observations = [];
  const objects = data.objects || {};
  const workflows = data.workflows || {};

  // Check for unused custom properties
  const objectEntries = Object.entries(objects).filter(([k]) => !k.startsWith('_'));
  for (const [key, val] of objectEntries) {
    if (val.customProperties?.length > 50) {
      observations.push(`${key} has ${val.customProperties.length} custom properties - consider reviewing for unused ones.`);
    }
  }

  // Check for inactive workflows
  const inactiveCount = workflows.summary?.inactive || 0;
  if (inactiveCount > 10) {
    observations.push(`${inactiveCount} inactive workflows found - consider archiving unused workflows.`);
  }

  // Check for zero-record objects
  for (const [key, val] of objectEntries) {
    if (val.recordCount === 0) {
      observations.push(`${key} has 0 records - verify this object is in use.`);
    }
  }

  if (observations.length === 0) {
    observations.push('No major issues detected. Portal appears well-maintained.');
  }

  observations.forEach((obs, i) => {
    slide.addText(`  ${obs}`, {
      x: 0.5, y: 1.4 + i * 0.45, w: 9, h: 0.4,
      fontSize: 11, color: COLORS.darkText, fontFace: 'Arial',
      bullet: true,
    });
  });
}

function countPipelines(pipelines) {
  let count = 0;
  for (const val of Object.values(pipelines)) {
    if (Array.isArray(val)) count += val.length;
  }
  return count;
}
