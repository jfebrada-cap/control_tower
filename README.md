# Coreless/Banking AWS Control Tower CDK Automation

This project uses AWS Cloud Development Kit (CDK) in TypeScript to automate the deployment and configuration of AWS Control Tower landing zones 
with multi-account governance.

## Features

- AWS Organizations & OUs: Automated creation and management of Organizational Units
- Service Control Policies: Security and compliance policies with automated attachments
- Account Factory: Lambda-backed custom resources for dynamic AWS account creation
- Control Tower Enrollment: Step Functions workflow for automatic account enrollment
- Security Baseline: Pre-configured SCPs for security best practices
- Multi-Account Structure: Pre-defined account structure for enterprise environments

## Project Structure

```
control-tower/
├── bin/
│   └── control-tower.ts                         # CDK app entry point
├── lib/
│   ├── parameters.ts                            # Global configuration
│   ├── org-creation-stack.ts                    # AWS Organizations setup
│   ├── org-structure-stacks.ts                  # OU structure creation
│   ├── enable-scp-stack.ts                      # SCP support enablement
│   ├── scp-policies-stack.ts                    # SCP definitions & attachments
│   ├── control-tower-landingzone-stack.ts       # Control Tower landing zone
│   ├── control-tower-stack.ts                   # Main orchestration stack
│   ├── account-factory/
│   │   ├── account-factory-stack.ts             # Account provisioning stack
│   │   └── create-account-function/
│   │       └── index.ts                         # Lambda for account creation
│   ├── accounts/                                # Account definitions
│   │   ├── AdministratorAWSAccount.ts
│   │   ├── CoreNetworkAWSAccount.ts
│   │   ├── ManagementAWSAccount.ts
│   │   ├── ObservabilityAWSAccount.ts
│   │   ├── DevopsAWSAccount.ts
│   │   └── ... (other accounts)
│   └── scp/                                     # Service Control Policies
│       ├── deny-root-user-actions.ts
│       ├── deny-s3-public-acl.ts
│       └── utils.ts
├── account-enrollment/
│   └── enrollment-state-machine-stack.ts        # Step Functions for enrollment
├── lambda/
│   ├── enable-scp.ts
│   └── enrollment-account-function/
│       ├── enroll-account-function/
│       │   └── index.ts                         # Lambda: enrollAccount API
│       └── trigger-enrollment/
│           └── index.ts                         # Lambda: triggers Step Function
└── configuration files...
```


### Prerequisites

- Node.js v18 or later
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed globally
- Management Account Access with Organizations and Control Tower permissions

### Installation

```powershell
# 1. Install AWS CDK CLI globally
npm install -g aws-cdk

# 2. Navigate to project directory
cd "C:\Users\Jfebrada\Desktop\Jereil\Projects\Avaloq\Avaloq Project\control-tower"

# 3. Install project dependencies
npm install

# 4. Verify installation
cdk --version
npm list --depth=0
```

### Dependencies

This project uses the following key dependencies:

**Runtime Dependencies:**
- aws-cdk-lib - AWS CDK construct library
- constructs - CDK construct programming model
- @aws-sdk/client-organizations - AWS Organizations SDK
- @aws-sdk/client-controltower - AWS Control Tower SDK

**Development Dependencies:**
- typescript - TypeScript compiler
- ts-node - TypeScript execution environment
- @types/node - TypeScript definitions for Node.js
- @types/aws-lambda - TypeScript definitions for AWS Lambda

## Configuration

### 1. Update Global Parameters

Edit lib/parameters.ts with your organization details:

```typescript
export const GlobalConfig = {
  // Replace with your management account ID
  account: '730335403101',
  
  // Set your preferred region
  region: 'ap-southeast-1',
  
  // Organization configuration
  organizationRootId: 'r-5030', // or 'r-root' for new organizations
  organizationExists: true, // Set to false for new organizations
  
  // Project metadata
  project: 'AWS_Organization',
  owner: 'Avaloq',
  businessUnit: 'LnD_Laboratory',
  
  // Control Tower configuration (will be updated after deployment)
  controlTowerEnrollmentStateMachineArn: 'arn:aws:states:<region>:<account>:stateMachine:EnrollToControlTower',
  
  // Resource tagging
  tags: {
    Project: 'AWS_Organization',
    Owner: 'Avaloq',
    BusinessUnit: 'LnD_Laboratory',
    Environment: 'Management',
  },
};
```

### 2. Configure AWS Credentials

Ensure your AWS CLI is configured with Management Account credentials:

```powershell
aws configure
# Enter Access Key, Secret Key, Region, and Output format
aws sts get-caller-identity  # Verify your identity
```

## Deployment

### Step 1: Bootstrap CDK Environment

Bootstrap your AWS environment (run once per account/region):

```powershell
cdk bootstrap aws://730335403101/ap-southeast-1
```

**Troubleshooting**: If you encounter BucketAlreadyExists errors:
1. Open AWS S3 Console
2. Delete the existing cdk-hnb659fds-assets-* bucket
3. Re-run the bootstrap command

### Step 2: Deploy Stacks

**Option A: Deploy All Stacks**
```powershell
cdk deploy --all
```

**Option B: Deploy Individual Stacks (Recommended for first-time setup)**

```powershell
# 1. Deploy Organization Structure
cdk deploy OrgStructureStack

# 2. Enable SCP Support
cdk deploy EnableSCPStack

# 3. Deploy SCP Policies
cdk deploy ScpPoliciesStack

# 4. Deploy Control Tower Landing Zone
cdk deploy ControlTowerLandingZoneStack

# 5. Deploy Account Factory
cdk deploy AccountFactoryStack

# 6. Deploy Account Enrollment State Machine
cdk deploy EnrollmentStateMachineStack
```

### Adding New AWS Accounts

1. Create a new account definition in lib/accounts/:

```typescript
// lib/accounts/NewTeamAccount.ts
import { AccountConfig } from './types';

export const account: AccountConfig = {
  name: 'NewTeamAccount',
  email: 'new-team-account@yourcompany.com',
  ouPath: '/BusinessUnits/Development',
  description: 'New team development account',
};
```

2. Export the account in lib/accounts/index.ts:

```typescript
export { account as NewTeamAccount } from './NewTeamAccount';
```

3. Deploy the account factory:

```powershell
cdk deploy AccountFactoryStack
```

### Managing Service Control Policies

1. Create new SCPs in lib/scp/ directory:

```typescript
// lib/scp/deny-regions.ts
import { scpPolicy } from './utils';

export const denyRegionsPolicy = scpPolicy({
  name: 'DenyUnapprovedRegions',
  description: 'Restrict resource creation to approved regions only',
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Deny',
        Action: '*',
        Resource: '*',
        Condition: {
          StringNotEquals: {
            'aws:RequestedRegion': ['ap-southeast-1', 'us-east-1']
          }
        }
      }
    ]
  }
});
```

2. Import and attach in scp-policies-stack.ts:

```typescript
import { denyRegionsPolicy } from './scp/deny-regions';
```

3. Deploy SCP stack:

```powershell
cdk deploy ScpPoliciesStack
```

### Modifying Organizational Structure

Edit lib/org-structure-stacks.ts to update OUs:

```typescript
new aws_organizations.CfnOrganizationalUnit(this, 'NewOU', {
  name: 'NewBusinessUnit',
  parentId: props.rootOrgId,
});
```

Deploy changes:
```powershell
cdk deploy OrgStructureStack
```

## Clean Installation and Dependency

If you want to clean your npm install and start fresh (best practice before uploading to GitHub or fixing dependency issues), 
here is the correct and clean method:

**Step 1 - Delete these folders/files**

Inside your project directory, delete:

- node_modules/
```
rm -r node_modules
```
or manually delete in File Explorer.

- package-lock.json
```
del package-lock.json
```
(Optional but highly recommended - avoids old dependency locks.)

**Step 2 - Run a clean install**

Once Node.js and npm are working:
```
npm install
```

This will:
- Recreate node_modules/
- Recreate a fresh package-lock.json
- Install exactly what is listed in package.json

**Result: Fresh and clean dependency environment**

This:
- Fixes missing modules
- Fixes outdated dependencies
- Fixes CDK TypeScript errors
- Makes the project clean for GitHub

**Optional: Deep cleaning (advanced)**

If you want the ultimate reset:

1. Clear npm cache:
```
npm cache clean --force
```

2. Reinstall everything:
```
npm install
```

## Troubleshooting

### Common Issues

1. CDK Bootstrap Failures
   - Ensure AWS CLI is properly configured
   - Verify IAM permissions in management account
   - Check for existing CDK bootstrap resources

2. Organization API Limits
   - AWS Organizations has rate limits
   - Add delays between stack deployments if needed

3. Control Tower Enrollment Failures
   - Verify account email addresses are unique
   - Check Control Tower service limits
   - Ensure all prerequisite services are enabled

### Useful Commands

```powershell
# List all available stacks
cdk list

# View stack differences
cdk diff

# Destroy all stacks (use with caution)
cdk destroy --all

# Check CDK version and context
cdk context --clear
cdk version
```

## Pre-defined Accounts

The project includes these core accounts:

- ManagementAWSAccount: Central governance and operations
- CoreNetworkAWSAccount: Network hub and shared services
- ObservabilityAWSAccount: Centralized logging and monitoring
- DevopsAWSAccount: CI/CD and deployment automation
- AdministratorAWSAccount: Break-glass and administrative access
- Tenant Accounts: Various workload accounts for different environments

## Security

The deployment includes these security SCPs by default:

- Deny Root User Actions: Prevents root user API calls
- Deny S3 Public ACL: Blocks public S3 bucket access
- Additional policies can be added in the scp/ directory

This Proof of Concept for the Coreless/Banking Landing Zone enables internal assessment and research within the R&D Laboratory.
Platform Owner: Dr. Nills Bulling — Strategic Product & Business Leader, Digital Transformation