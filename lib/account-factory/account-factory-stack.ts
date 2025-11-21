import { Stack, StackProps, Duration, CustomResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { GlobalConfig } from '../parameters';

// Use RELATIVE imports instead of aliases to avoid module not found errors
import { accounts } from '../accounts'; // <-- loads from lib/accounts/index.ts
import { AccountConfig } from '../accounts/types'; // <-- matches your types.ts export

export class AccountFactoryStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      env: { region: GlobalConfig.region },
      tags: GlobalConfig.tags,
    });

    const createAccountFn = new NodejsFunction(this, 'CreateAccountFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'create-account-function', 'index.ts'),
      timeout: Duration.minutes(15),
      description: 'Creates AWS Organization accounts and moves them to OUs',
    });

    createAccountFn.addToRolePolicy(new PolicyStatement({
      actions: [
        'organizations:CreateAccount',
        'organizations:DescribeCreateAccountStatus',
        'organizations:MoveAccount',
        'organizations:ListParents',
      ],
      resources: ['*'],
    }));

    const provider = new cr.Provider(this, 'AccountFactoryProvider', {
      onEventHandler: createAccountFn,
    });

    for (const account of accounts as AccountConfig[]) {
      const ouId = StringParameter.valueForStringParameter(this, account.ouPath);

      new CustomResource(this, `CreateAccount-${account.name}`, {
        serviceToken: provider.serviceToken,
        properties: {
          AccountName: account.name,
          Email: account.email,
          OUId: ouId,
          RoleName: account.roleName || 'OrganizationAccountAccessRole',
        },
      });
    }
  }
}
