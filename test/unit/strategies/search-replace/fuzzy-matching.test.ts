import { searchReplaceService } from "../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: fuzzy matching", () => {
  it("should match content with small differences (>90% similar)", async () => {
    const originalContent =
      "function getData() {\n    const results = fetchData();\n    return results.filter(Boolean);\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function getData() {
    const result = fetchData();
    return results.filter(Boolean);
}
=======
function getData() {
    const data = fetchData();
    return data.filter(Boolean);
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        "function getData() {\n    const data = fetchData();\n    return data.filter(Boolean);\n}\n",
      )
    }
  })

  it("should not match when content is too different (<90% similar)", async () => {
    const originalContent = "function processUsers(data) {\n    return data.map(user => user.name);\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function handleItems(items) {
    return items.map(item => item.username);
}
=======
function processData(data) {
    return data.map(d => d.value);
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })

  it("should match content with extra whitespace", async () => {
    const originalContent = "function sum(a, b) {\n    return a + b;\n}"
    const diffContent = `test.ts
<<<<<<< SEARCH
function   sum(a,   b)    {
    return    a + b;
}
=======
function sum(a, b) {
    return a + b + 1;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function sum(a, b) {\n    return a + b + 1;\n}")
    }
  })

  it("should not exact match empty lines", async () => {
    const originalContent = "function sum(a, b) {\n\n    return a + b;\n}"
    const diffContent = `test.ts
<<<<<<< SEARCH
function sum(a, b) {
=======
import { a } from "a";
function sum(a, b) {
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe('import { a } from "a";\nfunction sum(a, b) {\n\n    return a + b;\n}')
    }
  })
})