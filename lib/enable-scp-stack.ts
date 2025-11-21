import { Stack, StackProps, Duration, CustomResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { GlobalConfig } from './parameters';

export class EnableSCPStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      env: { region: GlobalConfig.region },
      tags: GlobalConfig.tags,
    });

    // Lambda function to enable SCP support in the Org root
    const enableSCPFn = new NodejsFunction(this, 'EnableSCPFn', {
      entry: path.join(__dirname, '../lambda/enable-scp.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.minutes(2),
      logRetention: RetentionDays.ONE_WEEK,
      bundling: {
        forceDockerBundling: false,
        externalModules: ['aws-sdk'],
      },
    });

    // IAM permissions to manage SCP settings
    enableSCPFn.addToRolePolicy(new PolicyStatement({
      actions: [
        'organizations:EnablePolicyType',
        'organizations:ListRoots',
        'organizations:ListPolicyTypes',
      ],
      resources: ['*'], // TODO: Scope this if possible to the org root ARN
    }));

    // Custom resource to invoke the lambda
    new CustomResource(this, 'EnableSCPResource', {
      serviceToken: enableSCPFn.functionArn,
    });
  }
}
