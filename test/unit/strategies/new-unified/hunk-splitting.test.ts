import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: hunk splitting", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should handle large diffs with multiple non-contiguous changes", async () => {
    const original = `import { readFile } from 'fs';
import { join } from 'path';
import { Logger } from './logger';

const logger = new Logger();

async function processFile(filePath: string) {
  try {
    const data = await readFile(filePath, 'utf8');
    logger.info('File read successfully');
    return data;
  } catch (error) {
    logger.error('Failed to read file:', error);
    throw error;
  }
}

function validateInput(input: string): boolean {
  if (!input) {
    logger.warn('Empty input received');
    return false;
  }
  return input.length > 0;
}

async function writeOutput(data: string) {
  logger.info('Processing output');
  // TODO: Implement output writing
  return Promise.resolve();
}

function parseConfig(configPath: string) {
  logger.debug('Reading config from:', configPath);
  // Basic config parsing
  return {
    enabled: true,
    maxRetries: 3
  };
}

export {
  processFile,
  validateInput,
  writeOutput,
  parseConfig
};`

    const diff = `--- a/file.ts
+++ b/file.ts
@@ ... @@
-import { readFile } from 'fs';
+import { readFile, writeFile } from 'fs';
 import { join } from 'path';
-import { Logger } from './logger';
+import { Logger } from './utils/logger';
+import { Config } from './types';

-const logger = new Logger();
+const logger = new Logger('FileProcessor');

 async function processFile(filePath: string) {
   try {
     const data = await readFile(filePath, 'utf8');
-    logger.info('File read successfully');
+    logger.info(\`File \${filePath} read successfully\`);
     return data;
   } catch (error) {
-    logger.error('Failed to read file:', error);
+    logger.error(\`Failed to read file \${filePath}:\`, error);
     throw error;
   }
 }

 function validateInput(input: string): boolean {
   if (!input) {
-    logger.warn('Empty input received');
+    logger.warn('Validation failed: Empty input received');
     return false;
   }
-  return input.length > 0;
+  return input.trim().length > 0;
 }

-async function writeOutput(data: string) {
-  logger.info('Processing output');
-  // TODO: Implement output writing
-  return Promise.resolve();
+async function writeOutput(data: string, outputPath: string) {
+  try {
+    await writeFile(outputPath, data, 'utf8');
+    logger.info(\`Output written to \${outputPath}\`);
+  } catch (error) {
+    logger.error(\`Failed to write output to \${outputPath}:\`, error);
+    throw error;
+  }
 }

-function parseConfig(configPath: string) {
-  logger.debug('Reading config from:', configPath);
-  // Basic config parsing
-  return {
-    enabled: true,
-    maxRetries: 3
-  };
+async function parseConfig(configPath: string): Promise<Config> {
+  try {
+    const configData = await readFile(configPath, 'utf8');
+    logger.debug(\`Reading config from \${configPath}\`);
+    return JSON.parse(configData);
+  } catch (error) {
+    logger.error(\`Failed to parse config from \${configPath}:\`, error);
+    throw error;
+  }
 }

 export {
   processFile,
   validateInput,
   writeOutput,
-  parseConfig
+  parseConfig,
+  type Config
 };`

    const expected = `import { readFile, writeFile } from 'fs';
import { join } from 'path';
import { Logger } from './utils/logger';
import { Config } from './types';

const logger = new Logger('FileProcessor');

async function processFile(filePath: string) {
  try {
    const data = await readFile(filePath, 'utf8');
    logger.info(\`File \${filePath} read successfully\`);
    return data;
  } catch (error) {
    logger.error(\`Failed to read file \${filePath}:\`, error);
    throw error;
  }
}

function validateInput(input: string): boolean {
  if (!input) {
    logger.warn('Validation failed: Empty input received');
    return false;
  }
  return input.trim().length > 0;
}

async function writeOutput(data: string, outputPath: string) {
  try {
    await writeFile(outputPath, data, 'utf8');
    logger.info(\`Output written to \${outputPath}\`);
  } catch (error) {
    logger.error(\`Failed to write output to \${outputPath}:\`, error);
    throw error;
  }
}

async function parseConfig(configPath: string): Promise<Config> {
  try {
    const configData = await readFile(configPath, 'utf8');
    logger.debug(\`Reading config from \${configPath}\`);
    return JSON.parse(configData);
  } catch (error) {
    logger.error(\`Failed to parse config from \${configPath}:\`, error);
    throw error;
  }
}

export {
  processFile,
  validateInput,
  writeOutput,
  parseConfig,
  type Config
};`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })
})