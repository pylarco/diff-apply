import { searchReplaceService } from "../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: deletion", () => {
  it("should delete code when replace block is empty", async () => {
    const originalContent = `function test() {
    console.log("hello");
    // Comment to remove
    console.log("world");
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
    // Comment to remove
=======
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    console.log("hello");
    console.log("world");
}`)
    }
  })

  it("should delete multiple lines when replace block is empty", async () => {
    const originalContent = `class Example {
    constructor() {
        // Initialize
        this.value = 0;
        // Set defaults
        this.name = "";
        // End init
    }
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
        // Initialize
        this.value = 0;
        // Set defaults
        this.name = "";
        // End init
=======
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
    }
}`)
    }
  })

  it("should preserve indentation when deleting nested code", async () => {
    const originalContent = `function outer() {
    if (true) {
        // Remove this
        console.log("test");
        // And this
    }
    return true;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
        // Remove this
        console.log("test");
        // And this
=======
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function outer() {
    if (true) {
    }
    return true;
}`)
    }
  })
})