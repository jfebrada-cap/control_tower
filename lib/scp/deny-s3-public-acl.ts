import { Construct } from 'constructs';
import { CfnPolicy } from 'aws-cdk-lib/aws-organizations';
import { getOUIds } from './utils';

export function deployDenyS3PublicACL(scope: Construct) {
  new CfnPolicy(scope, 'DenyS3PublicACL', {
    name: 'DenyS3PublicACL',
    description: 'Prevent public-read ACL on S3 buckets',
    type: 'SERVICE_CONTROL_POLICY',
    targetIds: getOUIds(scope, ['EdgeSecurity', 'DevOps', 'CustomerPRD']),
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
