// lib/account-enrollment/enrollment-state-machine-stack.ts

import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export class EnrollmentStateMachineStack extends Stack {
  public readonly stateMachineArn: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Step 1: EnrollAccount
    const enrollAccount = new tasks.CallAwsService(this, 'Enroll Account', {
      service: 'controltower',
      action: 'enrollAccount',
      parameters: {
        AccountId: sfn.JsonPath.stringAt('$.AccountId'),
        OrganizationalUnitId: sfn.JsonPath.stringAt('$.OUName'),
      },
      iamResources: ['*'], // Required for CT API
      resultPath: '$.EnrollResult',
    });

    // Step 2: Wait before polling
    const wait = new sfn.Wait(this, 'Wait 10 Seconds', {
      time: sfn.WaitTime.duration(Duration.seconds(10)),
    });

    // Step 3: Check Enrollment Status
    const getStatus = new tasks.CallAwsService(this, 'Check Enrollment Status', {
      service: 'controltower',
      action: 'getAccountEnrollmentStatus',
      parameters: {
        AccountId: sfn.JsonPath.stringAt('$.AccountId'),
      },
      iamResources: ['*'],
      resultPath: '$.EnrollmentStatus',
    });

    // Step 4: Evaluate status
    const succeeded = new sfn.Choice(this, 'Enrollment Succeeded?')
      .when(sfn.Condition.stringEquals('$.EnrollmentStatus.Status', 'SUCCEEDED'), new sfn.Succeed(this, 'Success'))
      .when(sfn.Condition.stringEquals('$.EnrollmentStatus.Status', 'FAILED'), new sfn.Fail(this, 'Enrollment Failed', {
        cause: 'Control Tower enrollment failed.',
        error: sfn.JsonPath.stringAt('$.EnrollmentStatus.FailureReason'),
      }))
      .otherwise(wait);

    // Chain
    const definition = enrollAccount
      .next(wait)
      .next(getStatus)
      .next(succeeded);

    const stateMachine = new sfn.StateMachine(this, 'AccountEnrollmentStateMachine', {
      definition,
      timeout: Duration.minutes(10),
    });

    this.stateMachineArn = stateMachine.stateMachineArn;
  }
}
