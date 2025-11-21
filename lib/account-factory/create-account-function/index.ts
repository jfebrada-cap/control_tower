import {
  OrganizationsClient,
  CreateAccountCommand,
  DescribeCreateAccountStatusCommand,
  MoveAccountCommand,
} from '@aws-sdk/client-organizations';
import { CloudFormationCustomResourceEvent } from 'aws-lambda';

export const handler = async (event: CloudFormationCustomResourceEvent) => {
  const client = new OrganizationsClient({});

  if (event.RequestType === 'Create') {
    const { AccountName, Email, OUId, RoleName } = event.ResourceProperties;

    const createRes = await client.send(new CreateAccountCommand({
      AccountName,
      Email,
      RoleName: RoleName || 'OrganizationAccountAccessRole',
    }));

    const requestId = createRes.CreateAccountStatus?.Id;
    if (!requestId) throw new Error("CreateAccountStatus ID not returned");

    // Wait for account creation to finish
    let status = 'IN_PROGRESS';
    let accountId = '';
    while (status === 'IN_PROGRESS') {
      await new Promise(r => setTimeout(r, 10000));
      const desc = await client.send(new DescribeCreateAccountStatusCommand({
        CreateAccountRequestId: requestId,
      }));
      status = desc.CreateAccountStatus?.State || 'FAILED';
      accountId = desc.CreateAccountStatus?.AccountId || '';
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Account creation failed: ${status}`);
    }

    if (OUId && accountId) {
      await client.send(new MoveAccountCommand({
        AccountId: accountId,
        DestinationParentId: OUId,
        SourceParentId: 'r-xxxx', // replace with actual root ID
      }));
    }

    return {
      PhysicalResourceId: accountId,
    };
  }

  return { PhysicalResourceId: event.PhysicalResourceId };
};
