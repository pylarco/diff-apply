import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: error handling and edge cases", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should reject completely invalid diff format", async () => {
    const original = "line1\nline2\nline3"
    const invalidDiff = "this is not a diff at all"

    const result = await strategy.applyDiff({ originalContent: original, diffContent: invalidDiff })
    expect(result.success).toBe(false)
  })

  it("should reject diff with invalid hunk format", async () => {
    const original = "line1\nline2\nline3"
    const invalidHunkDiff = `--- a/file.txt
+++ b/file.txt
invalid hunk header
 line1
-line2
+new line`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: invalidHunkDiff })
    expect(result.success).toBe(false)
  })

  it("should fail when diff tries to modify non-existent content", async () => {
    const original = "line1\nline2\nline3"
    const nonMatchingDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
-nonexistent line
+new line
 line3`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: nonMatchingDiff })
    expect(result.success).toBe(false)
  })

  it("should handle overlapping hunks", async () => {
    const original = `line1
line2
line3
line4
line5`
    const overlappingDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
 line2
-line3
+modified3
 line4
@@ ... @@
 line2
-line3
-line4
+modified3and4
 line5`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: overlappingDiff })
    expect(result.success).toBe(false)
  })

  it("should handle empty lines modifications", async () => {
    const original = `line1

line3

line5`
    const emptyLinesDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1

-line3
+line3modified

 line5`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: emptyLinesDiff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`line1

line3modified

line5`)
    }
  })

  it("should handle mixed line endings in diff", async () => {
    const original = "line1\r\nline2\nline3\r\n"
    const mixedEndingsDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1\r
-line2
+modified2\r
 line3`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: mixedEndingsDiff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("line1\r\nmodified2\r\nline3\r\n")
    }
  })

  it("should handle partial line modifications", async () => {
    const original = "const value = oldValue + 123;"
    const partialDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
-const value = oldValue + 123;
+const value = newValue + 123;`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: partialDiff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("const value = newValue + 123;")
    }
  })

  it("should handle slightly malformed but recoverable diff", async () => {
    const original = "line1\nline2\nline3"
    // Missing space after --- and +++
    const slightlyBadDiff = `---a/file.txt
+++b/file.txt
@@ ... @@
 line1
-line2
+new line
 line3`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: slightlyBadDiff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("line1\nnew line\nline3")
    }
  })
})