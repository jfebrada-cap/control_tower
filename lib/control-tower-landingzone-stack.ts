import { Stack, StackProps, aws_kms as kms } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GlobalConfig } from './parameters';
// import { CfnAccount } from 'aws-cdk-lib/aws-organizations'; // Uncomment when ready

export class ControlTowerLandingZoneStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      env: { region: GlobalConfig.region },
      tags: GlobalConfig.tags,
    });

    // KMS key for Control Tower log encryption
    new kms.Key(this, 'ControlTowerLogKmsKey', {
      alias: 'alias/control-tower-logs',
      description: 'KMS key for encrypting Control Tower logs',
      enableKeyRotation: true,
    });

    /*
    // Future: Log Archive Account
    new CfnAccount(this, 'LogArchiveAccount', {
      accountName: 'LogArchive',
      email: 'logarchive@example.com',
      roleName: 'AWSControlTowerExecution',
      // parentId: 'ou-xxxx-yyyy', // Optional: Place under specific OU
    });

    // Future: Audit Account
    new CfnAccount(this, 'AuditAccount', {
      accountName: 'Audit',
      email: 'audit@example.com',
      roleName: 'AWSControlTowerExecution',
      // parentId: 'ou-xxxx-yyyy', // Optional: Place under specific OU
    });
    */
  }
}
