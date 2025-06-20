import { searchReplaceService } from "../../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: line-constrained search", () => {
  it("should find and replace within specified line range", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function two() {
    return 2;
}
=======
function two() {
    return "two";
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 5, endLine: 7, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function two() {
    return "two";
}

function three() {
    return 3;
}`)
    }
  })

  it("should find and replace within buffer zone (5 lines before/after)", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function three() {
    return 3;
}
=======
function three() {
    return "three";
}
>>>>>>> REPLACE`

    // Even though we specify lines 5-7, it should still find the match at lines 9-11
    // because it's within the 5-line buffer zone
    const result = applyDiff({ originalContent, diffContent, startLine: 5, endLine: 7, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return "three";
}`)
    }
  })

  it("should not find matches outside search range and buffer zone", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}

function four() {
    return 4;
}

function five() {
    return 5;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function five() {
    return 5;
}
=======
function five() {
    return "five";
}
>>>>>>> REPLACE`

    // Searching around function two() (lines 5-7)
    // function five() is more than 5 lines away, so it shouldn't match
    const result = applyDiff({ originalContent, diffContent, startLine: 5, endLine: 7, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(false)
  })

  it("should handle search range at start of file", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function one() {
    return 1;
}
=======
function one() {
    return "one";
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 1, endLine: 3, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return "one";
}

function two() {
    return 2;
}`)
    }
  })

  it("should handle search range at end of file", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function two() {
    return 2;
}
=======
function two() {
    return "two";
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 5, endLine: 7, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function two() {
    return "two";
}`)
    }
  })

  it("should match specific instance of duplicate code using line numbers", async () => {
    const originalContent = `
function processData(data) {
    return data.map(x => x * 2);
}

function unrelatedStuff() {
    console.log("hello");
}

// Another data processor
function processData(data) {
    return data.map(x => x * 2);
}

function moreStuff() {
    console.log("world");
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function processData(data) {
    return data.map(x => x * 2);
}
=======
function processData(data) {
    // Add logging
    console.log("Processing data...");
    return data.map(x => x * 2);
}
>>>>>>> REPLACE`

    // Target the second instance of processData
    const result = applyDiff({ originalContent, diffContent, startLine: 10, endLine: 12, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function processData(data) {
    return data.map(x => x * 2);
}

function unrelatedStuff() {
    console.log("hello");
}

// Another data processor
function processData(data) {
    // Add logging
    console.log("Processing data...");
    return data.map(x => x * 2);
}

function moreStuff() {
    console.log("world");
}`)
    }
  })

  it("should search from start line to end of file when only start_line is provided", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function three() {
    return 3;
}
=======
function three() {
    return "three";
}
>>>>>>> REPLACE`

    // Only provide start_line, should search from there to end of file
    const result = applyDiff({ originalContent, diffContent, startLine: 8, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return "three";
}`)
    }
  })

  it("should search from start of file to end line when only end_line is provided", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function one() {
    return 1;
}
=======
function one() {
    return "one";
}
>>>>>>> REPLACE`

    // Only provide end_line, should search from start of file to there
    const result = applyDiff({ originalContent, diffContent, endLine: 4, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return "one";
}

function two() {
    return 2;
}

function three() {
    return 3;
}`)
    }
  })

  it("should prioritize exact line match over expanded search", async () => {
    const originalContent = `
function one() {
    return 1;
}

function process() {
    return "old";
}

function process() {
    return "old";
}

function two() {
    return 2;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
function process() {
    return "old";
}
=======
function process() {
    return "new";
}
>>>>>>> REPLACE`

    // Should match the second instance exactly at lines 10-12
    // even though the first instance at 6-8 is within the expanded search range
    const result = applyDiff({ originalContent, diffContent, startLine: 10, endLine: 12, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`
function one() {
    return 1;
}

function process() {
    return "old";
}

function process() {
    return "new";
}

function two() {
    return 2;
}`)
    }
  })

  it("should fall back to expanded search only if exact match fails", async () => {
    const originalContent = `
function one() {
    return 1;
}

function process() {
    return "target";
}

function two() {
    return 2;
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function process() {
    return "target";
}
=======
function process() {
    return "updated";
}
>>>>>>> REPLACE`

    // Specify wrong line numbers (3-5), but content exists at 6-8
    // Should still find and replace it since it's within the expanded range
    const result = applyDiff({ originalContent, diffContent, startLine: 3, endLine: 5, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function process() {
    return "updated";
}

function two() {
    return 2;
}`)
    }
  })
})