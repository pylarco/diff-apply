import { searchReplaceService } from "../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: insertion", () => {
  it("should insert code at specified line when search block is empty", async () => {
    const originalContent = `function test() {
    const x = 1;
    return x;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======
    console.log("Adding log");
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 2, endLine: 2 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    console.log("Adding log");
    const x = 1;
    return x;
}`)
    }
  })

  it("should preserve indentation when inserting at nested location", async () => {
    const originalContent = `function test() {
    if (true) {
        const x = 1;
    }
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======
        console.log("Before");
        console.log("After");
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 3, endLine: 3 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    if (true) {
        console.log("Before");
        console.log("After");
        const x = 1;
    }
}`)
    }
  })

  it("should handle insertion at start of file", async () => {
    const originalContent = `function test() {
    return true;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======
// Copyright 2024
// License: MIT

>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 1, endLine: 1 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`// Copyright 2024
// License: MIT

function test() {
    return true;
}`)
    }
  })

  it("should handle insertion at end of file", async () => {
    const originalContent = `function test() {
    return true;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======

// End of file
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 4, endLine: 4 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    return true;
}

// End of file`)
    }
  })

  it("should error if no start_line is provided for insertion", async () => {
    const originalContent = `function test() {
    return true;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======
console.log("test");
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })
})