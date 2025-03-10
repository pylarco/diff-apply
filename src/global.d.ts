import { describe as _describe, expect as _expect, it as _it, beforeEach as _beforeEach } from "bun:test";

declare global {
  const describe: typeof _describe;
  const expect: typeof _expect;
  const it: typeof _it;
  const beforeEach: typeof _beforeEach;
}

// This export is needed to ensure this file is treated as a module
export { };
