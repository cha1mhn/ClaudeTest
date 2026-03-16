#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createClient } from './src/hubspot-client.js';
import { auditObjects } from './src/audit-objects.js';
import { auditWorkflows } from './src/audit-workflows.js';
import {
  auditPipelines,
  auditForms,
  auditLists,
  auditEmailMarketing,
  auditOwners,
  auditAssociations,
  auditPortalInfo,
} from './src/audit-assets.js';
import { generateReport } from './src/report-generator.js';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --portal <portalId> --token <accessToken> [--output <file>]')
  .option('portal', {
    alias: 'p',
    describe: 'HubSpot Portal ID',
    type: 'string',
    demandOption: true,
  })
  .option('token', {
    alias: 't',
    describe: 'HubSpot Personal Access Key',
    type: 'string',
    demandOption: true,
  })
  .option('output', {
    alias: 'o',
    describe: 'Output PPTX file path',
    type: 'string',
    default: null,
  })
  .help()
  .parseSync();

async function runAudit(portalId, accessToken, outputPath) {
  console.log(`\n=== HubSpot Portal Audit ===`);
  console.log(`Portal ID: ${portalId}`);
  console.log(`Output: ${outputPath}\n`);

  const client = createClient(accessToken);
  const auditData = {};

  // Run all audits
  const steps = [
    { name: 'Portal Info', fn: () => auditPortalInfo(client), key: 'portalInfo' },
    { name: 'CRM Objects & Properties', fn: () => auditObjects(client), key: 'objects' },
    { name: 'Workflows', fn: () => auditWorkflows(client), key: 'workflows' },
    { name: 'Pipelines', fn: () => auditPipelines(client), key: 'pipelines' },
    { name: 'Forms', fn: () => auditForms(client), key: 'forms' },
    { name: 'Lists', fn: () => auditLists(client), key: 'lists' },
    { name: 'Marketing Emails', fn: () => auditEmailMarketing(client), key: 'emails' },
    { name: 'Owners', fn: () => auditOwners(client), key: 'owners' },
    { name: 'Associations', fn: () => auditAssociations(client), key: 'associations' },
  ];

  for (const step of steps) {
    process.stdout.write(`  Auditing ${step.name}...`);
    try {
      auditData[step.key] = await step.fn();
      console.log(' Done');
    } catch (err) {
      console.log(` Error: ${err.message}`);
      auditData[step.key] = { error: err.message };
    }
  }

  // Generate PPTX
  console.log(`\n  Generating PPTX report...`);
  await generateReport(auditData, outputPath);
  console.log(`  Report saved to: ${outputPath}`);
  console.log(`\n=== Audit Complete ===\n`);
}

const portalId = argv.portal;
const accessToken = argv.token;
const outputFile = argv.output || `hubspot-audit-${portalId}-${new Date().toISOString().slice(0, 10)}.pptx`;

runAudit(portalId, accessToken, outputFile).catch(err => {
  console.error(`\nFatal error: ${err.message}`);
  process.exit(1);
});
