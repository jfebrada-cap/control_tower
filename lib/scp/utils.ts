import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export function getOUIds(scope: Construct, names: string[]): string[] {
  return names.map(name =>
    StringParameter.valueForStringParameter(scope, `/org/ou/${name}`)
  );
}
