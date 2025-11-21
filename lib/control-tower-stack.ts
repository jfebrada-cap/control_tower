import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GlobalConfig } from './parameters';

export class ControlTowerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      env: { region: GlobalConfig.region },
      tags: GlobalConfig.tags,
    });

    // Define Control Tower specific resources here
    // Example: Config Rules, SCP Attachments, Notifications
  }
}
