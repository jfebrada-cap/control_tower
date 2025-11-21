// lib/accounts/index.ts
import * as fs from 'fs';
import * as path from 'path';
import { AccountConfig } from './types';

const accounts: AccountConfig[] = [];

const directoryPath = __dirname;

for (const file of fs.readdirSync(directoryPath)) {
  // Skip index.ts and non-.ts files
  if (file === 'index.ts' || !file.endsWith('.ts')) continue;

  // Import each account module dynamically
  const modulePath = path.join(directoryPath, file);
  const module = require(modulePath) as { [key: string]: AccountConfig };

  // Push all exported account objects into the list
  for (const key in module) {
    accounts.push(module[key]);
  }
}

export { accounts };
