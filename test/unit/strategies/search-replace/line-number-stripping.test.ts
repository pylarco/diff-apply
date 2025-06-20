import { searchReplaceService } from "../../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: line number stripping", () => {
  it("should strip line numbers from both search and replace sections", async () => {
    const originalContent = "function test() {\n    return true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
1 | function test() {
2 |     return true;
3 | }
=======
1 | function test() {
2 |     return false;
3 | }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\n    return false;\n}\n")
    }
  })

  it("should strip line numbers with leading spaces", async () => {
    const originalContent = "function test() {\n    return true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
 1 | function test() {
 2 |     return true;
 3 | }
=======
 1 | function test() {
 2 |     return false;
 3 | }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\n    return false;\n}\n")
    }
  })

  it("should not strip when not all lines have numbers in either section", async () => {
    const originalContent = "function test() {\n    return true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
1 | function test() {
2 |     return true;
3 | }
=======
1 | function test() {
    return false;
3 | }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })

  it("should preserve content that naturally starts with pipe", async () => {
    const originalContent = "|header|another|\n|---|---|\n|data|more|\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
1 | |header|another|
2 | |---|---|
3 | |data|more|
=======
1 | |header|another|
2 | |---|---|
3 | |data|updated|
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("|header|another|\n|---|---|\n|data|updated|\n")
    }
  })

  it("should preserve indentation when stripping line numbers", async () => {
    const originalContent = "    function test() {\n        return true;\n    }\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
1 |     function test() {
2 |         return true;
3 |     }
=======
1 |     function test() {
2 |         return false;
3 |     }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("    function test() {\n        return false;\n    }\n")
    }
  })

  it("should handle different line numbers between sections", async () => {
    const originalContent = "function test() {\n    return true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
10 | function test() {
11 |     return true;
12 | }
=======
20 | function test() {
21 |     return false;
22 | }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\n    return false;\n}\n")
    }
  })

  it("should not strip content that starts with pipe but no line number", async () => {
    const originalContent = "| Pipe\n|---|\n| Data\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
| Pipe
|---|
| Data
=======
| Pipe
|---|
| Updated
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("| Pipe\n|---|\n| Updated\n")
    }
  })

  it("should handle mix of line-numbered and pipe-only content", async () => {
    const originalContent = "| Pipe\n|---|\n| Data\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
| Pipe
|---|
| Data
=======
1 | | Pipe
2 | |---|
3 | | NewData
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("1 | | Pipe\n2 | |---|\n3 | | NewData\n")
    }
  })
})