import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

interface EventPayload {
  AccountId: string;
  OUName: string;
  StateMachineArn: string;
}

export const handler = async (event: any): Promise<void> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const requestType = event.RequestType;
  if (requestType === 'Delete') {
    console.log('Delete event received. No action needed.');
    return;
  }

  const { AccountId, OUName, StateMachineArn } = event.ResourceProperties as EventPayload;

  const stepFnClient = new SFNClient({});
  const inputPayload = JSON.stringify({ AccountId, OUName });

  try {
    const command = new StartExecutionCommand({
      stateMachineArn: StateMachineArn,
      input: inputPayload,
    });

    const response = await stepFnClient.send(command);
    console.log('Step Function execution started:', response.executionArn);
  } catch (error) {
    console.error('Failed to start Step Function execution:', error);
    throw error;
  }
};
