import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnOrganizationalUnit } from 'aws-cdk-lib/aws-organizations';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { GlobalConfig } from './parameters';

export class OrgStructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      env: { region: GlobalConfig.region },
      tags: GlobalConfig.tags,
    });

    // Replace this with your actual Organization Root ID
    const rootId = GlobalConfig.organizationRootId;

    // Creates OU and stores its ID in SSM Parameter Store
    const createOU = (name: string, logicalId: string): CfnOrganizationalUnit => {
      const ou = new CfnOrganizationalUnit(this, logicalId, {
        name,
        parentId: rootId,
      });

      new StringParameter(this, `${logicalId}SSM`, {
        parameterName: `/org/ou/${name}`,
        stringValue: ou.ref,
      });

      return ou;
    };

    // Define your organizational structure
    createOU('DevOps', 'DevOpsOU');
    createOU('Infrastructure', 'InfrastructureOU');
    createOU('CustomerPRD', 'CustomerPRDOU');
    createOU('CustomerNPRD', 'CustomerNPRDOU');
    createOU('Development', 'DevelopmentOU');
    createOU('EdgeSecurity', 'EdgeSecurityOU');
    createOU('BCP', 'BCPOU');
    createOU('Suspended', 'SuspendedOU');
  }
}
