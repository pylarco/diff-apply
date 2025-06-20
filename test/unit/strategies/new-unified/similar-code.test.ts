import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: similar code sections", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should correctly modify the right section when similar code exists", async () => {
    const original = `function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a + b;  // Bug here
}`

    const diff = `--- a/math.js
+++ b/math.js
@@ ... @@
 function multiply(a, b) {
-  return a + b;  // Bug here
+  return a * b;
 }`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}`)
    }
  })

  it("should handle multiple similar sections with correct context", async () => {
    const original = `if (condition) {
  doSomething();
  doSomething();
  doSomething();
}

if (otherCondition) {
  doSomething();
  doSomething();
  doSomething();
}`

    const diff = `--- a/file.js
+++ b/file.js
@@ ... @@
 if (otherCondition) {
   doSomething();
-  doSomething();
+  doSomethingElse();
   doSomething();
 }`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`if (condition) {
  doSomething();
  doSomething();
  doSomething();
}

if (otherCondition) {
  doSomething();
  doSomethingElse();
  doSomething();
}`)
    }
  })
})