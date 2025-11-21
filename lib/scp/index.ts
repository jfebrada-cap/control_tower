import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GlobalConfig } from '../parameters';
import { deployDenyS3PublicACL } from './deny-s3-public-acl';

export class ScpPoliciesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      env: { region: GlobalConfig.region },
      tags: GlobalConfig.tags,
    });

    deployDenyS3PublicACL(this);
    // Add more SCPs here as needed
  }
}
