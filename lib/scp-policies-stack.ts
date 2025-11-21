import { Stack, StackProps, aws_ssm as ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnPolicy } from 'aws-cdk-lib/aws-organizations';
import { GlobalConfig } from './parameters';

export class ScpPoliciesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      env: { region: GlobalConfig.region },
      tags: GlobalConfig.tags,
    });

    const getOUId = (name: string): string =>
      ssm.StringParameter.valueForStringParameter(this, `/org/ou/${name}`);

    const targetOUs = [
      getOUId('EdgeSecurity'),
      getOUId('DevOps'),
      getOUId('CustomerPRD'),
    ];

    new CfnPolicy(this, 'DenyS3PublicACL', {
      name: 'DenyS3PublicACL',
      description: 'Prevents use of public-read ACLs on S3 buckets',
      type: 'SERVICE_CONTROL_POLICY',
      targetIds: targetOUs,
      content: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyPublicReadACL',
            Effect: 'Deny',
            Action: 's3:PutBucketAcl',
            Resource: '*',
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'public-read',
              },
            },
          },
        ],
      },
    });
  }
}
