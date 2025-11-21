#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GlobalConfig } from '../lib/parameters';

// Stacks
import { OrgStructureStack } from '../lib/org-structure-stacks';
import { EnableSCPStack } from '../lib/enable-scp-stack';
import { ScpPoliciesStack } from '../lib/scp-policies-stack';
import { ControlTowerLandingZoneStack } from '../lib/control-tower-landingzone-stack';
import { AccountFactoryStack } from '../lib/account-factory/account-factory-stack';
// import { OrgCreationStack } from '../lib/org-creation-stack'; // Uncomment for new org setup

const app = new cdk.App();

// Shared stack properties
const stackProps = {
  env: {
    account: GlobalConfig.account,
    region: GlobalConfig.region,
  },
  tags: GlobalConfig.tags,
};

// ─────────────────────────────────────────────────────────────────────────────
// Control Tower Setup Workflow
// ─────────────────────────────────────────────────────────────────────────────

// Optional: Create new Organization (only if org doesn't exist)
// if (!GlobalConfig.organizationExists) {
//   new OrgCreationStack(app, 'OrgCreationStack', stackProps);
// }

new OrgStructureStack(app, 'OrgStructureStack', stackProps);
new EnableSCPStack(app, 'EnableSCPStack', stackProps);
new ScpPoliciesStack(app, 'ScpPoliciesStack', stackProps);
new ControlTowerLandingZoneStack(app, 'ControlTowerLandingZoneStack', stackProps);
new AccountFactoryStack(app, 'AccountFactoryStack', stackProps);

// ─────────────────────────────────────────────────────────────────────────────
// Usage:
//   cdk synth --app "npx ts-node bin/control-tower.ts"
//   cdk deploy --all --app "npx ts-node bin/control-tower.ts"
// ─────────────────────────────────────────────────────────────────────────────
