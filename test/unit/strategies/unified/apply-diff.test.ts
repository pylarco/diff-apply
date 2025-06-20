import { applyDiff } from "../../../../src/strategies/unified.service"

describe("UnifiedDiffStrategy: applyDiff", () => {
  it("should successfully apply a function modification diff", async () => {
    const originalContent = `import { Logger } from '../logger';

function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => {
    return sum + item;
  }, 0);
}

export { calculateTotal };`

    const diffContent = `--- src/utils/helper.ts
+++ src/utils/helper.ts
@@ -1,9 +1,10 @@
 import { Logger } from '../logger';

 function calculateTotal(items: number[]): number {
-  return items.reduce((sum, item) => {
-    return sum + item;
+  const total = items.reduce((sum, item) => {
+    return sum + item * 1.1;  // Add 10% markup
   }, 0);
+  return Math.round(total * 100) / 100;  // Round to 2 decimal places
 }

 export { calculateTotal };`

    const expected = `import { Logger } from '../logger';

function calculateTotal(items: number[]): number {
  const total = items.reduce((sum, item) => {
    return sum + item * 1.1;  // Add 10% markup
  }, 0);
  return Math.round(total * 100) / 100;  // Round to 2 decimal places
}

export { calculateTotal };`

    const result = await applyDiff(originalContent, diffContent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should successfully apply a diff adding a new method", async () => {
    const originalContent = `class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}`

    const diffContent = `--- src/Calculator.ts
+++ src/Calculator.ts
@@ -1,5 +1,9 @@
 class Calculator {
   add(a: number, b: number): number {
     return a + b;
   }
+
+  multiply(a: number, b: number): number {
+    return a * b;
+  }
 }`

    const expected = `class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }
}`

    const result = await applyDiff(originalContent, diffContent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should successfully apply a diff modifying imports", async () => {
    const originalContent = `import { useState } from 'react';
import { Button } from './components';

function App() {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount(count + 1)}>{count}</Button>;
}`

    const diffContent = `--- src/App.tsx
+++ src/App.tsx
@@ -1,7 +1,8 @@
-import { useState } from 'react';
+import { useState, useEffect } from 'react';
 import { Button } from './components';

 function App() {
   const [count, setCount] = useState(0);
+  useEffect(() => { document.title = \`Count: \${count}\` }, [count]);
   return <Button onClick={() => setCount(count + 1)}>{count}</Button>;
 }`

    const expected = `import { useState, useEffect } from 'react';
import { Button } from './components';

function App() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = \`Count: \${count}\` }, [count]);
  return <Button onClick={() => setCount(count + 1)}>{count}</Button>;
}`

    const result = await applyDiff(originalContent, diffContent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should successfully apply a diff with multiple hunks", async () => {
    const originalContent = `import { readFile, writeFile } from 'fs';

function processFile(path: string) {
  readFile(path, 'utf8', (err, data) => {
    if (err) throw err;
    const processed = data.toUpperCase();
    writeFile(path, processed, (err) => {
      if (err) throw err;
    });
  });
}

export { processFile };`

    const diffContent = `--- src/file-processor.ts
+++ src/file-processor.ts
@@ -1,4 +1,5 @@
 import { readFile, writeFile } from 'fs';
+import { join } from 'path';
 
 function processFile(path: string) {
   readFile(path, 'utf8', (err, data) => {
@@ -8,6 +9,7 @@
       if (err) throw err;
     });
   });
+  console.log('Processing complete');
 }
 
 export { processFile };`

    const expected = `import { readFile, writeFile } from 'fs';
import { join } from 'path';

function processFile(path: string) {
  readFile(path, 'utf8', (err, data) => {
    if (err) throw err;
    const processed = data.toUpperCase();
    writeFile(path, processed, (err) => {
      if (err) throw err;
    });
  });
  console.log('Processing complete');
}

export { processFile };`

    const result = await applyDiff(originalContent, diffContent)
    console.log("Unified diff result:", JSON.stringify(result, null, 2))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should handle empty original content", async () => {
    const originalContent = ""
    const diffContent = `--- empty.ts
+++ empty.ts
@@ -0,0 +1,3 @@
+export function greet(name: string): string {
+  return \`Hello, \${name}!\`;
+}`

    const expected = `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}\n`

    const result = await applyDiff(originalContent, diffContent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })
})