import { Stack, StackProps, Duration, CustomResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';

interface AccountEnrollmentStackProps extends StackProps {
  accountId: string;
  ouName: string;
  stateMachineArn: string;
}

export class AccountEnrollmentStack extends Stack {
  constructor(scope: Construct, id: string, props: AccountEnrollmentStackProps) {
    super(scope, id, props);

    // ✅ Matches: lambda/enrollment-account-function/trigger-enrollment/index.ts
    const triggerLambda = new lambda.Function(this, 'TriggerEnrollmentLambda', {
      runtime: lambda.Runtime.NODEJS_18_X, // ✅ Fixed: correct enum value
      handler: 'index.handler',
      timeout: Duration.minutes(2),
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../../../lambda/enrollment-account-function/trigger-enrollment')
      ),
    });

    triggerLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [props.stateMachineArn],
    }));

    const provider = new cr.Provider(this, 'EnrollmentTriggerProvider', {
      onEventHandler: triggerLambda,
    });

    new CustomResource(this, 'TriggerEnrollmentCustomResource', {
      serviceToken: provider.serviceToken,
      properties: {
        AccountId: props.accountId,
        OUName: props.ouName,
        StateMachineArn: props.stateMachineArn,
      },
    });
  }
}
