export const GlobalConfig = {
    account: '730335403101',
    region: 'ap-southeast-1',
    project: 'AWS_Organization',
    owner: 'Avaloq',
    businessUnit: 'LnD_Laboratory',
    organizationRootId: 'r-5030',
    organizationExists: true,   // <-- Add this flag, set to false if org needs creation
    controlTowerEnrollmentStateMachineArn: 'arn:aws:states:ap-southeast-1:730335403101:stateMachine:EnrollToControlTower',
    tags: {
      Project: 'AWS_Organization',
      Owner: 'Avaloq',
      BusinessUnit: 'LnD_Laboratory',
    },
  };
  