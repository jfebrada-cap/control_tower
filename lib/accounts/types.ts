export interface AccountConfig {
    name: string;
    email: string;
    ouPath: string;  // This should match an SSM parameter path like "/org/ou/DevOps"
    roleName?: string;
  }
  