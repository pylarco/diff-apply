This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.
The content has been processed where content has been formatted for parsing in markdown style.

# Directory Structure
```
package.json
src/global.d.ts
src/index.ts
src/insert-groups.ts
src/strategies/__tests__/multi-search-replace.test.ts
src/strategies/__tests__/new-unified.test.ts
src/strategies/__tests__/search-replace.test.ts
src/strategies/__tests__/unified.test.ts
src/strategies/multi-search-replace.service.ts
src/strategies/new-unified/__tests__/edit-strategies.test.ts
src/strategies/new-unified/__tests__/search-strategies.test.ts
src/strategies/new-unified/edit-strategies.service.ts
src/strategies/new-unified/index.ts
src/strategies/new-unified/search-strategies.service.ts
src/strategies/new-unified/types.ts
src/strategies/unified.service.ts
src/types.ts
src/utils/extract-text.service.ts
test/unit/strategies/multi-search-replace/apply-diff.test.ts
test/unit/strategies/multi-search-replace/get-tool-description.test.ts
test/unit/strategies/new-unified/apply-diff.test.ts
test/unit/strategies/new-unified/constructor.test.ts
test/unit/strategies/new-unified/edge-cases.test.ts
test/unit/strategies/new-unified/get-tool-description.test.ts
test/unit/strategies/new-unified/hunk-splitting.test.ts
test/unit/strategies/new-unified/similar-code.test.ts
test/unit/strategies/search-replace/deletion.test.ts
test/unit/strategies/search-replace/exact-matching.test.ts
test/unit/strategies/search-replace/fuzzy-matching.test.ts
test/unit/strategies/search-replace/get-tool-description.test.ts
test/unit/strategies/search-replace/insertion.test.ts
test/unit/strategies/search-replace/line-constrained-search.test.ts
test/unit/strategies/search-replace/line-number-stripping.test.ts
test/unit/strategies/unified/apply-diff.test.ts
test/unit/strategies/unified/get-tool-description.test.ts
tsconfig.build.json
tsconfig.json
tsconfig.tsbuildinfo
```

# Files

## File: tsconfig.tsbuildinfo
```
{"root":["./src/global.d.ts","./src/index.ts","./src/insert-groups.ts","./src/types.ts","./src/strategies/multi-search-replace.service.ts","./src/strategies/unified.service.ts","./src/strategies/__tests__/multi-search-replace.test.ts","./src/strategies/__tests__/new-unified.test.ts","./src/strategies/__tests__/search-replace.test.ts","./src/strategies/__tests__/unified.test.ts","./src/strategies/new-unified/edit-strategies.service.ts","./src/strategies/new-unified/index.ts","./src/strategies/new-unified/search-strategies.service.ts","./src/strategies/new-unified/types.ts","./src/strategies/new-unified/__tests__/edit-strategies.test.ts","./src/strategies/new-unified/__tests__/search-strategies.test.ts","./src/utils/extract-text.service.ts"],"errors":true,"version":"5.8.2"}
```

## File: src/global.d.ts
```typescript
import { describe as _describe, expect as _expect, it as _it, beforeEach as _beforeEach } from "bun:test";

declare global {
  const describe: typeof _describe;
  const expect: typeof _expect;
  const it: typeof _it;
  const beforeEach: typeof _beforeEach;
}

// This export is needed to ensure this file is treated as a module
export { };
```

## File: src/insert-groups.ts
```typescript
/**
 * Inserts multiple groups of elements at specified indices in an array
 * @param original Array to insert into, split by lines
 * @param insertGroups Array of groups to insert, each with an index and elements to insert
 * @returns New array with all insertions applied
 */
export interface InsertGroup {
	index: number
	elements: string[]
}

export function insertGroups(original: string[], insertGroups: InsertGroup[]): string[] {
	// Sort groups by index to maintain order
	insertGroups.sort((a, b) => a.index - b.index)

	let result: string[] = []
	let lastIndex = 0

	insertGroups.forEach(({ index, elements }) => {
		// Add elements from original array up to insertion point
		result.push(...original.slice(lastIndex, index))
		// Add the group of elements
		result.push(...elements)
		lastIndex = index
	})

	// Add remaining elements from original array
	result.push(...original.slice(lastIndex))

	return result
}
```

## File: src/strategies/new-unified/__tests__/search-strategies.test.ts
```typescript
import { findAnchorMatch, findExactMatch, findSimilarityMatch, findLevenshteinMatch } from "../search-strategies.service"

const testCases = [
  {
    name: "should return no match if the search string is not found",
    searchStr: "not found",
    content: ["line1", "line2", "line3"],
    expected: { index: -1, confidence: 0 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match if the search string is found",
    searchStr: "line2",
    content: ["line1", "line2", "line3"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match with correct index when startIndex is provided",
    searchStr: "line3",
    content: ["line1", "line2", "line3", "line4", "line3"],
    startIndex: 3,
    expected: { index: 4, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match even if there are more lines in content",
    searchStr: "line2",
    content: ["line1", "line2", "line3", "line4", "line5"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match even if the search string is at the beginning of the content",
    searchStr: "line1",
    content: ["line1", "line2", "line3"],
    expected: { index: 0, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match even if the search string is at the end of the content",
    searchStr: "line3",
    content: ["line1", "line2", "line3"],
    expected: { index: 2, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match for a multi-line search string",
    searchStr: "line2\nline3",
    content: ["line1", "line2", "line3", "line4"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return no match if a multi-line search string is not found",
    searchStr: "line2\nline4",
    content: ["line1", "line2", "line3", "line4"],
    expected: { index: -1, confidence: 0 },
    strategies: ["exact", "similarity"],
  },
  {
    name: "should return a match with indentation",
    searchStr: "  line2",
    content: ["line1", "  line2", "line3"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match with more complex indentation",
    searchStr: "    line3",
    content: ["  line1", "    line2", "    line3", "  line4"],
    expected: { index: 2, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match with mixed indentation",
    searchStr: "\tline2",
    content: ["  line1", "\tline2", "    line3"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match with mixed indentation and multi-line",
    searchStr: "  line2\n\tline3",
    content: ["line1", "  line2", "\tline3", "    line4"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return no match if mixed indentation and multi-line is not found",
    searchStr: "  line2\n    line4",
    content: ["line1", "  line2", "\tline3", "    line4"],
    expected: { index: -1, confidence: 0 },
    strategies: ["exact", "similarity"],
  },
  {
    name: "should return a match with leading and trailing spaces",
    searchStr: "  line2  ",
    content: ["line1", "  line2  ", "line3"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match with leading and trailing tabs",
    searchStr: "\tline2\t",
    content: ["line1", "\tline2\t", "line3"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match with mixed leading and trailing spaces and tabs",
    searchStr: " \tline2\t ",
    content: ["line1", " \tline2\t ", "line3"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return a match with mixed leading and trailing spaces and tabs and multi-line",
    searchStr: " \tline2\t \n  line3  ",
    content: ["line1", " \tline2\t ", "  line3  ", "line4"],
    expected: { index: 1, confidence: 1 },
    strategies: ["exact", "similarity", "levenshtein"],
  },
  {
    name: "should return no match if mixed leading and trailing spaces and tabs and multi-line is not found",
    searchStr: " \tline2\t \n  line4  ",
    content: ["line1", " \tline2\t ", "  line3  ", "line4"],
    expected: { index: -1, confidence: 0 },
    strategies: ["exact", "similarity"],
  },
]

describe("findExactMatch", () => {
  testCases.forEach(({ name, searchStr, content, startIndex, expected, strategies }) => {
    if (!strategies?.includes("exact")) {
      return
    }
    it(name, () => {
      const result = findExactMatch(searchStr, content, startIndex)
      expect(result.index).toBe(expected.index)
      expect(result.confidence).toBeGreaterThanOrEqual(expected.confidence)
      expect(result.strategy).toMatch(/exact(-overlapping)?/)
    })
  })
})

describe("findAnchorMatch", () => {
  const anchorTestCases = [
    {
      name: "should return no match if no anchors are found",
      searchStr: "   \n   \n   ",
      content: ["line1", "line2", "line3"],
      expected: { index: -1, confidence: 0 },
    },
    {
      name: "should return no match if anchor positions cannot be validated",
      searchStr: "unique line\ncontext line 1\ncontext line 2",
      content: [
        "different line 1",
        "different line 2",
        "different line 3",
        "another unique line",
        "context line 1",
        "context line 2",
      ],
      expected: { index: -1, confidence: 0 },
    },
    {
      name: "should return a match if anchor positions can be validated",
      searchStr: "unique line\ncontext line 1\ncontext line 2",
      content: ["line1", "line2", "unique line", "context line 1", "context line 2", "line 6"],
      expected: { index: 2, confidence: 1 },
    },
    {
      name: "should return a match with correct index when startIndex is provided",
      searchStr: "unique line\ncontext line 1\ncontext line 2",
      content: ["line1", "line2", "line3", "unique line", "context line 1", "context line 2", "line 7"],
      startIndex: 3,
      expected: { index: 3, confidence: 1 },
    },
    {
      name: "should return a match even if there are more lines in content",
      searchStr: "unique line\ncontext line 1\ncontext line 2",
      content: [
        "line1",
        "line2",
        "unique line",
        "context line 1",
        "context line 2",
        "line 6",
        "extra line 1",
        "extra line 2",
      ],
      expected: { index: 2, confidence: 1 },
    },
    {
      name: "should return a match even if the anchor is at the beginning of the content",
      searchStr: "unique line\ncontext line 1\ncontext line 2",
      content: ["unique line", "context line 1", "context line 2", "line 6"],
      expected: { index: 0, confidence: 1 },
    },
    {
      name: "should return a match even if the anchor is at the end of the content",
      searchStr: "unique line\ncontext line 1\ncontext line 2",
      content: ["line1", "line2", "unique line", "context line 1", "context line 2"],
      expected: { index: 2, confidence: 1 },
    },
    {
      name: "should return no match if no valid anchor is found",
      searchStr: "non-unique line\ncontext line 1\ncontext line 2",
      content: ["line1", "line2", "non-unique line", "context line 1", "context line 2", "non-unique line"],
      expected: { index: -1, confidence: 0 },
    },
  ]

  anchorTestCases.forEach(({ name, searchStr, content, startIndex, expected }) => {
    it(name, () => {
      const result = findAnchorMatch(searchStr, content, startIndex)
      expect(result.index).toBe(expected.index)
      expect(result.confidence).toBeGreaterThanOrEqual(expected.confidence)
      expect(result.strategy).toBe("anchor")
    })
  })
})

describe("findSimilarityMatch", () => {
  testCases.forEach(({ name, searchStr, content, startIndex, expected, strategies }) => {
    if (!strategies?.includes("similarity")) {
      return
    }
    it(name, () => {
      const result = findSimilarityMatch(searchStr, content, startIndex)
      expect(result.index).toBe(expected.index)
      expect(result.confidence).toBeGreaterThanOrEqual(expected.confidence)
      expect(result.strategy).toBe("similarity")
    })
  })
})

describe("findLevenshteinMatch", () => {
  testCases.forEach(({ name, searchStr, content, startIndex, expected, strategies }) => {
    if (!strategies?.includes("levenshtein")) {
      return
    }
    it(name, () => {
      const result = findLevenshteinMatch(searchStr, content, startIndex)
      expect(result.index).toBe(expected.index)
      expect(result.confidence).toBeGreaterThanOrEqual(expected.confidence)
      expect(result.strategy).toBe("levenshtein")
    })
  })
})
```

## File: src/strategies/new-unified/types.ts
```typescript
export type Change = {
	type: "context" | "add" | "remove"
	content: string
	indent: string
	originalLine?: string
}

export type Hunk = {
	changes: Change[]
}

export type Diff = {
	hunks: Hunk[]
}

export type EditResult = {
	confidence: number
	result: string[]
	strategy: string
}
```

## File: src/strategies/unified.service.ts
```typescript
// diff-apply-alvamind/src/strategies/unified.service.ts
import { applyPatch } from "diff";
import { DiffResult } from "../types";
import Alvamind from 'alvamind';

export const unifiedDiffService = Alvamind({ name: 'unified-diff.service' })
  .derive(() => ({
    unifiedDiffService: {
      getToolDescription: (args: { cwd: string; toolOptions?: { [key: string]: string } }): string => {
        return `## apply_diff
Description: Apply a unified diff to a file at the specified path. This tool is useful when you need to make specific modifications to a file based on a set of changes provided in unified diff format (diff -U3).

Parameters:
- path: (required) The path of the file to apply the diff to (relative to the current working directory ${args.cwd})
- diff: (required) The diff content in unified format to apply to the file.

Format Requirements:

1. Header (REQUIRED):
\`\`\`
--- path/to/original/file
+++ path/to/modified/file
\`\`\`
- Must include both lines exactly as shown
- Use actual file paths
- NO timestamps after paths

2. Hunks:
\`\`\`
@@ -lineStart,lineCount +lineStart,lineCount @@
-removed line
+added line
\`\`\`
- Each hunk starts with @@ showing line numbers for changes
- Format: @@ -originalStart,originalCount +newStart,newCount @@
- Use - for removed/changed lines
- Use + for new/modified lines
- Indentation must match exactly

Complete Example:

Original file (with line numbers):
\`\`\`
1 | import { Logger } from '../logger';
2 |
3 | function calculateTotal(items: number[]): number {
4 |   return items.reduce((sum, item) => {
5 |     return sum + item;
6 |   }, 0);
7 | }
8 |
9 | export { calculateTotal };
\`\`\`

After applying the diff, the file would look like:
\`\`\`
1 | import { Logger } from '../logger';
2 |
3 | function calculateTotal(items: number[]): number {
4 |   const total = items.reduce((sum, item) => {
5 |     return sum + item * 1.1;  // Add 10% markup
6 |   }, 0);
7 |   return Math.round(total * 100) / 100;  // Round to 2 decimal places
8 | }
9 |
10 | export { calculateTotal };
\`\`\`

Diff to modify the file:
\`\`\`
--- src/utils/helper.ts
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

export { calculateTotal };
\`\`\`

Common Pitfalls:
1. Missing or incorrect header lines
2. Incorrect line numbers in @@ lines
3. Wrong indentation in changed lines
4. Incomplete context (missing lines that need changing)
5. Not marking all modified lines with - and +

Best Practices:
1. Replace entire code blocks:
- Remove complete old version with - lines
- Add complete new version with + lines
- Include correct line numbers
2. Moving code requires two hunks:
- First hunk: Remove from old location
- Second hunk: Add to new location
3. One hunk per logical change
4. Verify line numbers match the line numbers you have in the file

Usage:
<apply_diff>
<path>File path here</path>
<diff>
Your diff here
</diff>
</apply_diff>
`;
      },

      applyDiff: (originalContent: string, diffContent: string): DiffResult => {
        try {
          const result = applyPatch(originalContent, diffContent);
          if (result === false) {
            return {
              success: false,
              error: "Failed to apply unified diff - patch rejected",
              details: {
                searchContent: diffContent,
              },
            };
          }
          return {
            success: true,
            content: result,
          };
        } catch (error: any) {
          return {
            success: false,
            error: `Error applying unified diff: ${(error as any).message}`,
            details: {
              searchContent: diffContent,
            },
          };
        }
      },
    }
  }));

export const { applyDiff, getToolDescription } = unifiedDiffService.unifiedDiffService
```

## File: src/types.ts
```typescript
/**
 * Interface for implementing different diff strategies
 */

export type DiffResult =
  | { success: true; content: string; failParts?: DiffResult[] }
  | ({
    success: false
    error?: string
    details?: {
      similarity?: number
      threshold?: number
      matchedRange?: { start: number; end: number }
      searchContent?: string
      bestMatch?: string
    }
    failParts?: DiffResult[]
  } & ({ error: string } | { failParts: DiffResult[] }))

export interface DiffStrategy {
  /**
   * Get the tool description for this diff strategy
   * @param args The tool arguments including cwd and toolOptions
   * @returns The complete tool description including format requirements and examples
   */
  getToolDescription(args: { cwd: string; toolOptions?: { [key: string]: string } }): string

  /**
   * Apply a diff to the original content
   * @param originalContent The original file content
   * @param diffContent The diff content in the strategy's format
   * @param startLine Optional line number where the search block starts. If not provided, searches the entire file.
   * @param endLine Optional line number where the search block ends. If not provided, searches the entire file.
   * @returns A DiffResult object containing either the successful result or error details
   */
  applyDiff(params: ApplyDiffParams): DiffResult
}


export interface ApplyDiffParams {
  originalContent: string
  diffContent: string
  fuzzyThreshold?: number
  bufferLines?: number
  startLine?: number
  endLine?: number
}
```

## File: test/unit/strategies/multi-search-replace/apply-diff.test.ts
```typescript
import { applyDiff } from "../../../../src/strategies/multi-search-replace.service";

describe("multiSearchReplaceService: applyDiff", () => {
  describe("exact matching", () => {
    it("should replace matching content", async () => {
      const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
      const diffContent = `test.ts
<<<<<<< SEARCH
function hello() {
    console.log("hello")
}
=======
function hello() {
    console.log("hello world")
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe('function hello() {\n    console.log("hello world")\n}\n')
      }
    })

    it("should match content with different surrounding whitespace", async () => {
      const originalContent = "\nfunction example() {\n    return 42;\n}\n\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
function example() {
    return 42;
}
=======
function example() {
    return 43;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("\nfunction example() {\n    return 43;\n}\n\n")
      }
    })

    it("should match content with different indentation in search block", async () => {
      const originalContent = "    function test() {\n        return true;\n    }\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
    return true;
}
=======
function test() {
    return false;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("    function test() {\n        return false;\n    }\n")
      }
    })

    it("should handle tab-based indentation", async () => {
      const originalContent = "function test() {\n\treturn true;\n}\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
\treturn true;
}
=======
function test() {
\treturn false;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("function test() {\n\treturn false;\n}\n")
      }
    })

    it("should preserve mixed tabs and spaces", async () => {
      const originalContent = "\tclass Example {\n\t    constructor() {\n\t\tthis.value = 0;\n\t    }\n\t}"
      const diffContent = `test.ts
<<<<<<< SEARCH
\tclass Example {
\t    constructor() {
\t\tthis.value = 0;
\t    }
\t}
=======
\tclass Example {
\t    constructor() {
\t\tthis.value = 1;
\t    }
\t}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          "\tclass Example {\n\t    constructor() {\n\t\tthis.value = 1;\n\t    }\n\t}",
        )
      }
    })

    it("should handle additional indentation with tabs", async () => {
      const originalContent = "\tfunction test() {\n\t\treturn true;\n\t}"
      const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
\treturn true;
}
=======
function test() {
\t// Add comment
\treturn false;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("\tfunction test() {\n\t\t// Add comment\n\t\treturn false;\n\t}")
      }
    })

    it("should preserve exact indentation characters when adding lines", async () => {
      const originalContent = "\tfunction test() {\n\t\treturn true;\n\t}"
      const diffContent = `test.ts
<<<<<<< SEARCH
\tfunction test() {
\t\treturn true;
\t}
=======
\tfunction test() {
\t\t// First comment
\t\t// Second comment
\t\treturn true;
\t}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          "\tfunction test() {\n\t\t// First comment\n\t\t// Second comment\n\t\treturn true;\n\t}",
        )
      }
    })

    it("should handle Windows-style CRLF line endings", async () => {
      const originalContent = "function test() {\r\n    return true;\r\n}\r\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
    return true;
}
=======
function test() {
    return false;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("function test() {\r\n    return false;\r\n}\r\n")
      }
    })

    it("should return false if search content does not match", async () => {
      const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
      const diffContent = `test.ts
<<<<<<< SEARCH
function hello() {
    console.log("wrong")
}
=======
function hello() {
    console.log("hello world")
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(false)
    })

    it("should return false if diff format is invalid", async () => {
      const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
      const diffContent = `test.ts\nInvalid diff format`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(false)
    })

    it("should handle multiple lines with proper indentation", async () => {
      const originalContent =
        "class Example {\n    constructor() {\n        this.value = 0\n    }\n\n    getValue() {\n        return this.value\n    }\n}\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
    getValue() {
        return this.value
    }
=======
    getValue() {
        // Add logging
        console.log("Getting value")
        return this.value
    }
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          'class Example {\n    constructor() {\n        this.value = 0\n    }\n\n    getValue() {\n        // Add logging\n        console.log("Getting value")\n        return this.value\n    }\n}\n',
        )
      }
    })

    it("should preserve whitespace exactly in the output", async () => {
      const originalContent = "    indented\n        more indented\n    back\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
    indented
        more indented
    back
=======
    modified
        still indented
    end
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("    modified\n        still indented\n    end\n")
      }
    })

    it("should preserve indentation when adding new lines after existing content", async () => {
      const originalContent = "				onScroll={() => updateHighlights()}"
      const diffContent = `test.ts
<<<<<<< SEARCH
				onScroll={() => updateHighlights()}
=======
				onScroll={() => updateHighlights()}
				onDragOver={(e) => {
					e.preventDefault()
					e.stopPropagation()
				}}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          "				onScroll={() => updateHighlights()}\n				onDragOver={(e) => {\n					e.preventDefault()\n					e.stopPropagation()\n				}}",
        )
      }
    })

    it("should handle varying indentation levels correctly", async () => {
      const originalContent = `
class Example {
    constructor() {
        this.value = 0;
        if (true) {
            this.init();
        }
    }
}`.trim()

      const diffContent = `test.ts
<<<<<<< SEARCH
    class Example {
        constructor() {
            this.value = 0;
            if (true) {
                this.init();
            }
        }
    }
=======
    class Example {
        constructor() {
            this.value = 1;
            if (true) {
                this.init();
                this.setup();
                this.validate();
            }
        }
    }
>>>>>>> REPLACE`.trim()

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          `
class Example {
    constructor() {
        this.value = 1;
        if (true) {
            this.init();
            this.setup();
            this.validate();
        }
    }
}`.trim(),
        )
      }
    })

    it("should handle mixed indentation styles in the same file", async () => {
      const originalContent = `class Example {
    constructor() {
        this.value = 0;
        if (true) {
            this.init();
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
    constructor() {
        this.value = 0;
        if (true) {
        this.init();
        }
    }
=======
    constructor() {
        this.value = 1;
        if (true) {
        this.init();
        this.validate();
        }
    }
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Example {
    constructor() {
        this.value = 1;
        if (true) {
        this.init();
        this.validate();
        }
    }
}`)
      }
    })

    it("should handle Python-style significant whitespace", async () => {
      const originalContent = `def example():
    if condition:
        do_something()
        for item in items:
            process(item)
    return True`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
    if condition:
        do_something()
        for item in items:
            process(item)
=======
    if condition:
        do_something()
        while items:
            item = items.pop()
            process(item)
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`def example():
    if condition:
        do_something()
        while items:
            item = items.pop()
            process(item)
    return True`)
      }
    })

    it("should preserve empty lines with indentation", async () => {
      const originalContent = `function test() {
    const x = 1;

    if (x) {
        return true;
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
    const x = 1;

    if (x) {
=======
    const x = 1;

    // Check x
    if (x) {
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`function test() {
    const x = 1;

    // Check x
    if (x) {
        return true;
    }
}`)
      }
    })

    it("should handle indentation when replacing entire blocks", async () => {
      const originalContent = `class Test {
    method() {
        if (true) {
            console.log("test");
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
    method() {
        if (true) {
            console.log("test");
        }
    }
=======
    method() {
        try {
            if (true) {
                console.log("test");
            }
        } catch (e) {
            console.error(e);
        }
    }
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Test {
    method() {
        try {
            if (true) {
                console.log("test");
            }
        } catch (e) {
            console.error(e);
        }
    }
}`)
      }
    })

    it("should handle negative indentation relative to search content", async () => {
      const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
            this.setup();
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
            this.setup();
=======
        this.init();
        this.setup();
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
        this.init();
        this.setup();
        }
    }
}`)
      }
    })

    it("should handle extreme negative indentation (no indent)", async () => {
      const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
=======
this.init();
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
this.init();
        }
    }
}`)
      }
    })

    it("should handle mixed indentation changes in replace block", async () => {
      const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
            this.setup();
            this.validate();
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
            this.setup();
            this.validate();
=======
        this.init();
            this.setup();
    this.validate();
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
        this.init();
            this.setup();
    this.validate();
        }
    }
}`)
      }
    })

    it("should find matches from middle out", async () => {
      const originalContent = `
function one() {
    return "target";
}

function two() {
    return "target";
}

function three() {
    return "target";
}

function four() {
    return "target";
}

function five() {
    return "target";
}`.trim()

      const diffContent = `test.ts
<<<<<<< SEARCH
    return "target";
=======
    return "updated";
>>>>>>> REPLACE`

      // Search around the middle (function three)
      // Even though all functions contain the target text,
      // it should match the one closest to line 9 first
      const result = await applyDiff(originalContent, diffContent, 0.9, 5, 9, 9)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`function one() {
    return "target";
}

function two() {
    return "target";
}

function three() {
    return "updated";
}

function four() {
    return "target";
}

function five() {
    return "target";
}`)
      }
    })
  });
});
```

## File: test/unit/strategies/multi-search-replace/get-tool-description.test.ts
```typescript
import { getToolDescription } from "../../../../src/strategies/multi-search-replace.service";

describe("multiSearchReplaceService: getToolDescription", () => {
  it("should include the current working directory", async () => {
    const cwd = "/test/dir"
    const description = await getToolDescription({ cwd })
    expect(description).toContain(`relative to the current working directory ${cwd}`)
  })

  it("should include required format elements", async () => {
    const description = await getToolDescription({ cwd: "/test" })
    expect(description).toContain("<<<<<<< SEARCH")
    expect(description).toContain("=======")
    expect(description).toContain(">>>>>>> REPLACE")
    expect(description).toContain("<apply_diff>")
    expect(description).toContain("</apply_diff>")
  })
})
```

## File: test/unit/strategies/new-unified/apply-diff.test.ts
```typescript
import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: applyDiff", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should apply simple diff correctly", async () => {
    const original = `line1
line2
line3`

    const diff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
+new line
 line2
-line3
+modified line3`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`line1
new line
line2
modified line3`)
    }
  })

  it("should handle multiple hunks", async () => {
    const original = `line1
line2
line3
line4
line5`

    const diff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
+new line
 line2
-line3
+modified line3
@@ ... @@
 line4
-line5
+modified line5
+new line at end`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`line1
new line
line2
modified line3
line4
modified line5
new line at end`)
    }
  })

  it("should handle complex large", async () => {
    const original = `line1
line2
line3
line4
line5
line6
line7
line8
line9
line10`

    const diff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
+header line
+another header
 line2
-line3
-line4
+modified line3
+modified line4
+extra line
@@ ... @@
 line6
+middle section
 line7
-line8
+changed line8
+bonus line
@@ ... @@
 line9
-line10
+final line
+very last line`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`line1
header line
another header
line2
modified line3
modified line4
extra line
line5
line6
middle section
line7
changed line8
bonus line
line9
final line
very last line`)
    }
  })

  it("should handle indentation changes", async () => {
    const original = `first line
  indented line
    double indented line
  back to single indent
no indent
  indented again
    double indent again
      triple indent
  back to single
last line`

    const diff = `--- original
+++ modified
@@ ... @@
 first line
   indented line
+	tab indented line
+  new indented line
     double indented line
   back to single indent
 no indent
   indented again
     double indent again
-      triple indent
+      hi there mate
   back to single
 last line`

    const expected = `first line
  indented line
	tab indented line
  new indented line
    double indented line
  back to single indent
no indent
  indented again
    double indent again
      hi there mate
  back to single
last line`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should handle high level edits", async () => {
    const original = `def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)`
    const diff = `@@ ... @@
-def factorial(n):
-    if n == 0:
-        return 1
-    else:
-        return n * factorial(n-1)
+def factorial(number):
+    if number == 0:
+        return 1
+    else:
+        return number * factorial(number-1)`

    const expected = `def factorial(number):
    if number == 0:
        return 1
    else:
        return number * factorial(number-1)`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("it should handle very complex edits", async () => {
    const original = `//Initialize the array that will hold the primes
var primeArray = [];
/*Write a function that checks for primeness and
 pushes those values to t*he array*/
function PrimeCheck(candidate){
  isPrime = true;
  for(var i = 2; i < candidate && isPrime; i++){
    if(candidate%i === 0){
      isPrime = false;
    } else {
      isPrime = true;
    }
  }
  if(isPrime){
    primeArray.push(candidate);
  }
  return primeArray;
}
/*Write the code that runs the above until the
 l ength of the array equa*ls the number of primes
 desired*/

var numPrimes = prompt("How many primes?");

//Display the finished array of primes

//for loop starting at 2 as that is the lowest prime number keep going until the array is as long as we requested
for (var i = 2; primeArray.length < numPrimes; i++) {
  PrimeCheck(i); //
}
console.log(primeArray);
`

    const diff = `--- test_diff.js
+++ test_diff.js
@@ ... @@
-//Initialize the array that will hold the primes
 var primeArray = [];
-/*Write a function that checks for primeness and
- pushes those values to t*he array*/
 function PrimeCheck(candidate){
   isPrime = true;
   for(var i = 2; i < candidate && isPrime; i++){
@@ ... @@
   return primeArray;
 }
-/*Write the code that runs the above until the
-  l ength of the array equa*ls the number of primes
-  desired*/

 var numPrimes = prompt("How many primes?");

-//Display the finished array of primes
-
-//for loop starting at 2 as that is the lowest prime number keep going until the array is as long as we requested
 for (var i = 2; primeArray.length < numPrimes; i++) {
-  PrimeCheck(i); //
+  PrimeCheck(i);
 }
 console.log(primeArray);`

    const expected = `var primeArray = [];
function PrimeCheck(candidate){
  isPrime = true;
  for(var i = 2; i < candidate && isPrime; i++){
    if(candidate%i === 0){
      isPrime = false;
    } else {
      isPrime = true;
    }
  }
  if(isPrime){
    primeArray.push(candidate);
  }
  return primeArray;
}

var numPrimes = prompt("How many primes?");

for (var i = 2; primeArray.length < numPrimes; i++) {
  PrimeCheck(i);
}
console.log(primeArray);
`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })
})
```

## File: test/unit/strategies/new-unified/constructor.test.ts
```typescript
import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: constructor", () => {
  it("should use default confidence threshold when not provided", () => {
    const defaultStrategy = create()
    expect(defaultStrategy.confidenceThreshold).toBe(1)
  })

  it("should use provided confidence threshold", () => {
    const customStrategy = create(0.85)
    expect(customStrategy.confidenceThreshold).toBe(0.85)
  })

  it("should enforce minimum confidence threshold", () => {
    const lowStrategy = create(0.7) // Below minimum of 0.8
    expect(lowStrategy.confidenceThreshold).toBe(0.8)
  })
})
```

## File: test/unit/strategies/new-unified/edge-cases.test.ts
```typescript
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
```

## File: test/unit/strategies/new-unified/get-tool-description.test.ts
```typescript
import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: getToolDescription", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should return tool description with correct cwd", () => {
    const cwd = "/test/path"
    const description = strategy.getToolDescription({ cwd })

    expect(description).toContain("apply_diff Tool - Generate Precise Code Changes")
    expect(description).toContain(cwd)
    expect(description).toContain("Step-by-Step Instructions")
    expect(description).toContain("Requirements")
    expect(description).toContain("Examples")
    expect(description).toContain("Parameters:")
  })
})
```

## File: test/unit/strategies/new-unified/hunk-splitting.test.ts
```typescript
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
```

## File: test/unit/strategies/new-unified/similar-code.test.ts
```typescript
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
```

## File: test/unit/strategies/search-replace/deletion.test.ts
```typescript
import { searchReplaceService } from "../../../../../dist"

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
```

## File: test/unit/strategies/search-replace/exact-matching.test.ts
```typescript
import { searchReplaceService } from "../../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: exact matching", () => {
  it("should replace matching content", async () => {
    const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
    const diffContent = `test.ts
<<<<<<< SEARCH
function hello() {
    console.log("hello")
}
=======
function hello() {
    console.log("hello world")
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe('function hello() {\n    console.log("hello world")\n}\n')
    }
  })

  it("should match content with different surrounding whitespace", async () => {
    const originalContent = "\nfunction example() {\n    return 42;\n}\n\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function example() {
    return 42;
}
=======
function example() {
    return 43;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("\nfunction example() {\n    return 43;\n}\n\n")
    }
  })

  it("should match content with different indentation in search block", async () => {
    const originalContent = "    function test() {\n        return true;\n    }\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
    return true;
}
=======
function test() {
    return false;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("    function test() {\n        return false;\n    }\n")
    }
  })

  it("should handle tab-based indentation", async () => {
    const originalContent = "function test() {\n\treturn true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
\treturn true;
}
=======
function test() {
\treturn false;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\n\treturn false;\n}\n")
    }
  })

  it("should preserve mixed tabs and spaces", async () => {
    const originalContent = "\tclass Example {\n\t    constructor() {\n\t\tthis.value = 0;\n\t    }\n\t}"
    const diffContent = `test.ts
<<<<<<< SEARCH
\tclass Example {
\t    constructor() {
\t\tthis.value = 0;
\t    }
\t}
=======
\tclass Example {
\t    constructor() {
\t\tthis.value = 1;
\t    }
\t}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        "\tclass Example {\n\t    constructor() {\n\t\tthis.value = 1;\n\t    }\n\t}",
      )
    }
  })

  it("should handle additional indentation with tabs", async () => {
    const originalContent = "\tfunction test() {\n\t\treturn true;\n\t}"
    const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
\treturn true;
}
=======
function test() {
\t// Add comment
\treturn false;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("\tfunction test() {\n\t\t// Add comment\n\t\treturn false;\n\t}")
    }
  })

  it("should preserve exact indentation characters when adding lines", async () => {
    const originalContent = "\tfunction test() {\n\t\treturn true;\n\t}"
    const diffContent = `test.ts
<<<<<<< SEARCH
\tfunction test() {
\t\treturn true;
\t}
=======
\tfunction test() {
\t\t// First comment
\t\t// Second comment
\t\treturn true;
\t}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        "\tfunction test() {\n\t\t// First comment\n\t\t// Second comment\n\t\treturn true;\n\t}",
      )
    }
  })

  it("should handle Windows-style CRLF line endings", async () => {
    const originalContent = "function test() {\r\n    return true;\r\n}\r\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
    return true;
}
=======
function test() {
    return false;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\r\n    return false;\r\n}\r\n")
    }
  })

  it("should return false if search content does not match", async () => {
    const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
    const diffContent = `test.ts
<<<<<<< SEARCH
function hello() {
    console.log("wrong")
}
=======
function hello() {
    console.log("hello world")
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })

  it("should return false if diff format is invalid", async () => {
    const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
    const diffContent = `test.ts\nInvalid diff format`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })

  it("should handle multiple lines with proper indentation", async () => {
    const originalContent =
      "class Example {\n    constructor() {\n        this.value = 0\n    }\n\n    getValue() {\n        return this.value\n    }\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
    getValue() {
        return this.value
    }
=======
    getValue() {
        // Add logging
        console.log("Getting value")
        return this.value
    }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        'class Example {\n    constructor() {\n        this.value = 0\n    }\n\n    getValue() {\n        // Add logging\n        console.log("Getting value")\n        return this.value\n    }\n}\n',
      )
    }
  })

  it("should preserve whitespace exactly in the output", async () => {
    const originalContent = "    indented\n        more indented\n    back\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
    indented
        more indented
    back
=======
    modified
        still indented
    end
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("    modified\n        still indented\n    end\n")
    }
  })

  it("should preserve indentation when adding new lines after existing content", async () => {
    const originalContent = "				onScroll={() => updateHighlights()}"
    const diffContent = `test.ts
<<<<<<< SEARCH
				onScroll={() => updateHighlights()}
=======
				onScroll={() => updateHighlights()}
				onDragOver={(e) => {
					e.preventDefault()
					e.stopPropagation()
				}}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        "				onScroll={() => updateHighlights()}\n				onDragOver={(e) => {\n					e.preventDefault()\n					e.stopPropagation()\n				}}",
      )
    }
  })

  it("should handle varying indentation levels correctly", async () => {
    const originalContent = `
class Example {
    constructor() {
        this.value = 0;
        if (true) {
            this.init();
        }
    }
}`.trim()

    const diffContent = `test.ts
<<<<<<< SEARCH
    class Example {
        constructor() {
            this.value = 0;
            if (true) {
                this.init();
            }
        }
    }
=======
    class Example {
        constructor() {
            this.value = 1;
            if (true) {
                this.init();
                this.setup();
                this.validate();
            }
        }
    }
>>>>>>> REPLACE`.trim()

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        `
class Example {
    constructor() {
        this.value = 1;
        if (true) {
            this.init();
            this.setup();
            this.validate();
        }
    }
}`.trim(),
      )
    }
  })

  it("should handle mixed indentation styles in the same file", async () => {
    const originalContent = `class Example {
    constructor() {
        this.value = 0;
        if (true) {
            this.init();
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
    constructor() {
        this.value = 0;
        if (true) {
        this.init();
        }
    }
=======
    constructor() {
        this.value = 1;
        if (true) {
        this.init();
        this.validate();
        }
    }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
        this.value = 1;
        if (true) {
        this.init();
        this.validate();
        }
    }
}`)
    }
  })

  it("should handle Python-style significant whitespace", async () => {
    const originalContent = `def example():
    if condition:
        do_something()
        for item in items:
            process(item)
    return True`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
    if condition:
        do_something()
        for item in items:
            process(item)
=======
    if condition:
        do_something()
        while items:
            item = items.pop()
            process(item)
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`def example():
    if condition:
        do_something()
        while items:
            item = items.pop()
            process(item)
    return True`)
    }
  })

  it("should preserve empty lines with indentation", async () => {
    const originalContent = `function test() {
    const x = 1;

    if (x) {
        return true;
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
    const x = 1;

    if (x) {
=======
    const x = 1;

    // Check x
    if (x) {
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    const x = 1;

    // Check x
    if (x) {
        return true;
    }
}`)
    }
  })

  it("should handle indentation when replacing entire blocks", async () => {
    const originalContent = `class Test {
    method() {
        if (true) {
            console.log("test");
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
    method() {
        if (true) {
            console.log("test");
        }
    }
=======
    method() {
        try {
            if (true) {
                console.log("test");
            }
        } catch (e) {
            console.error(e);
        }
    }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Test {
    method() {
        try {
            if (true) {
                console.log("test");
            }
        } catch (e) {
            console.error(e);
        }
    }
}`)
    }
  })

  it("should handle negative indentation relative to search content", async () => {
    const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
            this.setup();
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
            this.setup();
=======
        this.init();
        this.setup();
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
        this.init();
        this.setup();
        }
    }
}`)
    }
  })

  it("should handle extreme negative indentation (no indent)", async () => {
    const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
=======
this.init();
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
this.init();
        }
    }
}`)
    }
  })

  it("should handle mixed indentation changes in replace block", async () => {
    const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
            this.setup();
            this.validate();
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
            this.setup();
            this.validate();
=======
        this.init();
            this.setup();
    this.validate();
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
        this.init();
            this.setup();
    this.validate();
        }
    }
}`)
    }
  })

  it("should find matches from middle out", async () => {
    const originalContent = `
function one() {
    return "target";
}

function two() {
    return "target";
}

function three() {
    return "target";
}

function four() {
    return "target";
}

function five() {
    return "target";
}`.trim()

    const diffContent = `test.ts
<<<<<<< SEARCH
    return "target";
=======
    return "updated";
>>>>>>> REPLACE`

    // Search around the middle (function three)
    // Even though all functions contain the target text,
    // it should match the one closest to line 9 first
    const result = applyDiff({ originalContent, diffContent, startLine: 9, endLine: 9 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return "target";
}

function two() {
    return "target";
}

function three() {
    return "updated";
}

function four() {
    return "target";
}

function five() {
    return "target";
}`)
    }
  })
})
```

## File: test/unit/strategies/search-replace/fuzzy-matching.test.ts
```typescript
import { searchReplaceService } from "../../../../../dist"

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
```

## File: test/unit/strategies/search-replace/get-tool-description.test.ts
```typescript
import { searchReplaceService } from "../../../../../dist"

const { getToolDescription } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: getToolDescription", () => {
  it("should include the current working directory", async () => {
    const cwd = "/test/dir"
    const description = getToolDescription({ cwd })
    expect(description).toContain(`relative to the current working directory ${cwd}`)
  })

  it("should include required format elements", async () => {
    const description = getToolDescription({ cwd: "/test" })
    expect(description).toContain("<<<<<<< SEARCH")
    expect(description).toContain("=======")
    expect(description).toContain(">>>>>>> REPLACE")
    expect(description).toContain("<apply_diff>")
    expect(description).toContain("</apply_diff>")
  })

  it("should document start_line and end_line parameters", async () => {
    const description = getToolDescription({ cwd: "/test" })
    expect(description).toContain("start_line: (required) The line number where the search block starts.")
    expect(description).toContain("end_line: (required) The line number where the search block ends.")
  })
})
```

## File: test/unit/strategies/search-replace/insertion.test.ts
```typescript
import { searchReplaceService } from "../../../../../dist"

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
```

## File: test/unit/strategies/search-replace/line-constrained-search.test.ts
```typescript
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
```

## File: test/unit/strategies/search-replace/line-number-stripping.test.ts
```typescript
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
```

## File: test/unit/strategies/unified/apply-diff.test.ts
```typescript
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
@@ -1,12 +1,14 @@
-import { readFile, writeFile } from 'fs';
+import { promises as fs } from 'fs';
+import { join } from 'path';

-function processFile(path: string) {
-  readFile(path, 'utf8', (err, data) => {
-    if (err) throw err;
+async function processFile(path: string) {
+  try {
+    const data = await fs.readFile(join(__dirname, path), 'utf8');
     const processed = data.toUpperCase();
-    writeFile(path, processed, (err) => {
-      if (err) throw err;
-    });
-  });
+    await fs.writeFile(join(__dirname, path), processed);
+  } catch (error) {
+    console.error('Failed to process file:', error);
+    throw error;
+  }
 }

 export { processFile };`

    const expected = `import { promises as fs } from 'fs';
import { join } from 'path';

async function processFile(path: string) {
  try {
    const data = await fs.readFile(join(__dirname, path), 'utf8');
    const processed = data.toUpperCase();
    await fs.writeFile(join(__dirname, path), processed);
  } catch (error) {
    console.error('Failed to process file:', error);
    throw error;
  }
}

export { processFile };`

    const result = await applyDiff(originalContent, diffContent)
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
```

## File: test/unit/strategies/unified/get-tool-description.test.ts
```typescript
import { getToolDescription } from "../../../../src/strategies/unified.service"

describe("UnifiedDiffStrategy: getToolDescription", () => {
  it("should return tool description with correct cwd", () => {
    const cwd = "/test/path"
    const description = getToolDescription({ cwd })

    expect(description).toContain("apply_diff")
    expect(description).toContain(cwd)
    expect(description).toContain("Parameters:")
    expect(description).toContain("Format Requirements:")
  })
})
```

## File: tsconfig.build.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "./dist",
    "declaration": true,
    "sourceMap": true,
    "module": "ESNext",
    "target": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true
  },
  "include": ["src/*.ts"],
  "exclude": ["test", "dist", "node_modules"]
}
```

## File: tsconfig.json
```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": false,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true,
    "noEmit": true,
    "types": ["bun-types"]
  }
}
```

## File: src/index.ts
```typescript
// src/index.ts
// Export your public API here
// For example:

// If your code is currently in the root index.ts, move all its content here
import { InsertGroup } from "./insert-groups";
import { DiffStrategy, DiffResult } from './types';
import { newUnifiedDiffStrategyService } from './strategies/new-unified';
import { multiSearchReplaceService } from './strategies/multi-search-replace.service';
import { unifiedDiffService } from "./strategies/unified.service";

// Create an alias for searchReplaceService to point to the multiSearchReplaceService implementation
// This preserves the public API while consolidating the implementation.
const searchReplaceService = {
  searchReplaceService: multiSearchReplaceService.multiSearchReplaceService
};

export type { DiffStrategy, DiffResult, InsertGroup };
export { newUnifiedDiffStrategyService, multiSearchReplaceService, searchReplaceService, unifiedDiffService }
export const { unifiedDiffService: unifiedDiffStrategy } = unifiedDiffService
export const { newUnifiedDiffStrategyService: newUnifiedDiffStrategy } = newUnifiedDiffStrategyService
export const { multiSearchReplaceService: multiSearchReplaceDiffStrategy } = multiSearchReplaceService
export const { searchReplaceService: searchReplaceDiffStrategy } = searchReplaceService
```

## File: src/strategies/__tests__/multi-search-replace.test.ts
```typescript
//TODO: delete this file
```

## File: src/strategies/__tests__/new-unified.test.ts
```typescript
//TODO: delete this file
```

## File: src/strategies/__tests__/unified.test.ts
```typescript
//TODO: delete this file
```

## File: src/utils/extract-text.service.ts
```typescript
// diff-apply-alvamind/src/extract-text.service.ts
import Alvamind from 'alvamind';
import { distance } from "fastest-levenshtein";
import { compareTwoStrings } from "string-similarity";

export const textService = Alvamind({ name: 'extract-text.service' })
  .decorate('textService', {

    addLineNumbers: (content: string, startLine: number = 1): string => {
      const lines = content.split("\n");
      const maxLineNumberWidth = String(startLine + lines.length - 1).length;
      return lines
        .map((line, index) => {
          const lineNumber = String(startLine + index).padStart(maxLineNumberWidth, " ");
          return `${lineNumber} | ${line}`;
        })
        .join("\n");
    },
    everyLineHasLineNumbers: (content: string): boolean => {
      const lines = content.split(/\r?\n/);
      return lines.length > 0 && lines.every((line) => /^\s*\d+\s+\|(?!\|)/.test(line));
    },

    stripLineNumbers: (content: string): string => {
      // Split into lines to handle each line individually
      const lines = content.split(/\r?\n/);

      // Process each line
      const processedLines = lines.map((line) => {
        // Match line number pattern and capture everything after the pipe
        const match = line.match(/^\s*\d+\s+\|(?!\|)\s?(.*)$/);
        return match ? match[1] : line;
      });

      // Join back with original line endings
      const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
      return processedLines.join(lineEnding);
    },

    getLevenshteinSimilarity: (original: string, search: string): number => {
      if (search === "") {
        return 1;
      }
      const normalize = (str: string) => str.replace(/\s+/g, " ").trim();
      const normalizedOriginal = normalize(original);
      const normalizedSearch = normalize(search);
      if (normalizedOriginal === normalizedSearch) {
        return 1;
      }
      const dist = distance(normalizedOriginal, normalizedSearch);
      const maxLength = Math.max(normalizedOriginal.length, normalizedSearch.length);
      return 1 - dist / maxLength;
    },

    getStringSimilarity: (str1: string, str2: string): number => {
      return compareTwoStrings(str1, str2);
    }
  });
```

## File: src/strategies/__tests__/search-replace.test.ts
```typescript
//TODO: delete this file
```

## File: src/strategies/new-unified/__tests__/edit-strategies.test.ts
```typescript
const { applyContextMatching, applyDMP, applyInMemoryFallback } = editStrategiesService.editStrategiesService

import { editStrategiesService } from "../edit-strategies.service"
import { Hunk } from "../types"

const testCases = [
  {
    name: "should return original content if no match is found",
    hunk: {
      changes: [
        { type: "context", content: "line1" },
        { type: "add", content: "line2" },
      ],
    } as Hunk,
    content: ["line1", "line3"],
    matchPosition: -1,
    expected: {
      confidence: 0,
      result: ["line1", "line3"],
    },
    expectedResult: "line1\nline3",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a simple add change",
    hunk: {
      changes: [
        { type: "context", content: "line1" },
        { type: "add", content: "line2" },
      ],
    } as Hunk,
    content: ["line1", "line3"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["line1", "line2", "line3"],
    },
    expectedResult: "line1\nline2\nline3",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a simple remove change",
    hunk: {
      changes: [
        { type: "context", content: "line1" },
        { type: "remove", content: "line2" },
      ],
    } as Hunk,
    content: ["line1", "line2", "line3"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["line1", "line3"],
    },
    expectedResult: "line1\nline3",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a simple context change",
    hunk: {
      changes: [{ type: "context", content: "line1" }],
    } as Hunk,
    content: ["line1", "line2", "line3"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["line1", "line2", "line3"],
    },
    expectedResult: "line1\nline2\nline3",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a multi-line add change",
    hunk: {
      changes: [
        { type: "context", content: "line1" },
        { type: "add", content: "line2\nline3" },
      ],
    } as Hunk,
    content: ["line1", "line4"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["line1", "line2\nline3", "line4"],
    },
    expectedResult: "line1\nline2\nline3\nline4",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a multi-line remove change",
    hunk: {
      changes: [
        { type: "context", content: "line1" },
        { type: "remove", content: "line2\nline3" },
      ],
    } as Hunk,
    content: ["line1", "line2", "line3", "line4"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["line1", "line4"],
    },
    expectedResult: "line1\nline4",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a multi-line context change",
    hunk: {
      changes: [
        { type: "context", content: "line1" },
        { type: "context", content: "line2\nline3" },
      ],
    } as Hunk,
    content: ["line1", "line2", "line3", "line4"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["line1", "line2\nline3", "line4"],
    },
    expectedResult: "line1\nline2\nline3\nline4",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a change with indentation",
    hunk: {
      changes: [
        { type: "context", content: "  line1" },
        { type: "add", content: "    line2" },
      ],
    } as Hunk,
    content: ["  line1", "  line3"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["  line1", "    line2", "  line3"],
    },
    expectedResult: "  line1\n    line2\n  line3",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a change with mixed indentation",
    hunk: {
      changes: [
        { type: "context", content: "\tline1" },
        { type: "add", content: "  line2" },
      ],
    } as Hunk,
    content: ["\tline1", "  line3"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["\tline1", "  line2", "  line3"],
    },
    expectedResult: "\tline1\n  line2\n  line3",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a change with mixed indentation and multi-line",
    hunk: {
      changes: [
        { type: "context", content: "  line1" },
        { type: "add", content: "\tline2\n    line3" },
      ],
    } as Hunk,
    content: ["  line1", "  line4"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["  line1", "\tline2\n    line3", "  line4"],
    },
    expectedResult: "  line1\n\tline2\n    line3\n  line4",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a complex change with mixed indentation and multi-line",
    hunk: {
      changes: [
        { type: "context", content: "  line1" },
        { type: "remove", content: "    line2" },
        { type: "add", content: "\tline3\n      line4" },
        { type: "context", content: "  line5" },
      ],
    } as Hunk,
    content: ["  line1", "    line2", "  line5", "  line6"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["  line1", "\tline3\n      line4", "  line5", "  line6"],
    },
    expectedResult: "  line1\n\tline3\n      line4\n  line5\n  line6",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a complex change with mixed indentation and multi-line and context",
    hunk: {
      changes: [
        { type: "context", content: "  line1" },
        { type: "remove", content: "    line2" },
        { type: "add", content: "\tline3\n      line4" },
        { type: "context", content: "  line5" },
        { type: "context", content: "  line6" },
      ],
    } as Hunk,
    content: ["  line1", "    line2", "  line5", "  line6", "  line7"],
    matchPosition: 0,
    expected: {
      confidence: 1,
      result: ["  line1", "\tline3\n      line4", "  line5", "  line6", "  line7"],
    },
    expectedResult: "  line1\n\tline3\n      line4\n  line5\n  line6\n  line7",
    strategies: ["context", "dmp"],
  },
  {
    name: "should apply a complex change with mixed indentation and multi-line and context and a different match position",
    hunk: {
      changes: [
        { type: "context", content: "  line1" },
        { type: "remove", content: "    line2" },
        { type: "add", content: "\tline3\n      line4" },
        { type: "context", content: "  line5" },
        { type: "context", content: "  line6" },
      ],
    } as Hunk,
    content: ["  line0", "  line1", "    line2", "  line5", "  line6", "  line7"],
    matchPosition: 1,
    expected: {
      confidence: 1,
      result: ["  line0", "  line1", "\tline3\n      line4", "  line5", "  line6", "  line7"],
    },
    expectedResult: "  line0\n  line1\n\tline3\n      line4\n  line5\n  line6\n  line7",
    strategies: ["context", "dmp"],
  },
]

describe("applyContextMatching", () => {
  testCases.forEach(({ name, hunk, content, matchPosition, expected, strategies, expectedResult }) => {
    if (!strategies?.includes("context")) {
      return
    }
    it(name, () => {
      const result = applyContextMatching(hunk, content, matchPosition)
      expect(result.result.join("\n")).toEqual(expectedResult)
      expect(result.confidence).toBeGreaterThanOrEqual(expected.confidence)
      expect(result.strategy).toBe("context")
    })
  })
})

describe("applyDMP", () => {
  testCases.forEach(({ name, hunk, content, matchPosition, expected, strategies, expectedResult }) => {
    if (!strategies?.includes("dmp")) {
      return
    }
    it(name, () => {
      const result = applyDMP(hunk, content, matchPosition)
      expect(result.result.join("\n")).toEqual(expectedResult)
      expect(result.confidence).toBeGreaterThanOrEqual(expected.confidence)
      expect(result.strategy).toBe("dmp")
    })
  })
})

describe("applyInMemoryFallback", () => {
  it("should successfully apply changes using in-memory operations", async () => {
    const hunk = {
      changes: [
        { type: "context", content: "line1", indent: "" },
        { type: "remove", content: "line2", indent: "" },
        { type: "add", content: "new line2", indent: "" },
        { type: "context", content: "line3", indent: "" },
      ],
    } as Hunk

    const content = ["line1", "line2", "line3"]
    const result = await applyInMemoryFallback(hunk, content)

    expect(result.result.join("\n")).toEqual("line1\nnew line2\nline3")
    expect(result.confidence).toBeGreaterThanOrEqual(0.8) // Note: changed to match new implementation
    expect(result.strategy).toBe("in-memory-fallback")
  })

  it("should return original content with 0 confidence when changes cannot be applied", async () => {
    const hunk = {
      changes: [
        { type: "context", content: "nonexistent", indent: "" },
        { type: "add", content: "new line", indent: "" },
      ],
    } as Hunk

    const content = ["line1", "line2", "line3"]
    const result = await applyInMemoryFallback(hunk, content)

    expect(result.result).toEqual(content)
    expect(result.confidence).toBe(0)
    expect(result.strategy).toBe("in-memory-fallback")
  })
})
```

## File: src/strategies/new-unified/search-strategies.service.ts
```typescript
import { compareTwoStrings } from "string-similarity"
import { closest } from "fastest-levenshtein"
import { diff_match_patch } from "diff-match-patch"
import { Change, Hunk } from "./types"
import Alvamind from 'alvamind';
import { textService } from "../../utils/extract-text.service";

export type SearchResult = {
  index: number
  confidence: number
  strategy: string
}

const LARGE_FILE_THRESHOLD = 1000 // lines
const UNIQUE_CONTENT_BOOST = 0.05
const DEFAULT_OVERLAP_SIZE = 3 // lines of overlap between windows
const MAX_WINDOW_SIZE = 500 // maximum lines in a window

export const searchStrategiesService = Alvamind({ name: 'search-strategies.service' })
  .use(textService)
  .derive(({ textService: { getStringSimilarity }}) => {
    const serviceMethods = {
      // Helper function to calculate adaptive confidence threshold based on file size
      getAdaptiveThreshold: (contentLength: number, baseThreshold: number): number => {
        if (contentLength <= LARGE_FILE_THRESHOLD) {
          return baseThreshold
        }
        return Math.max(baseThreshold - 0.07, 0.8) // Reduce threshold for large files but keep minimum at 80%
      },

      // Helper function to evaluate content uniqueness
      evaluateContentUniqueness: (searchStr: string, content: string[]): number => {
        const searchLines = searchStr.split("\n")
        const uniqueLines = new Set(searchLines)
        const contentStr = content.join("\n")

        // Calculate how many search lines are relatively unique in the content
        let uniqueCount = 0
        for (const line of uniqueLines) {
          const regex = new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
          const matches = contentStr.match(regex)
          if (matches && matches.length <= 2) {
            // Line appears at most twice
            uniqueCount++
          }
        }

        return uniqueCount / uniqueLines.size
      },

      // Helper function to build text from hunk changes
      getTextFromChanges: (changes: Change[], types: Array<'context' | 'add' | 'remove'>): string => {
        return changes
          .filter((change) => types.includes(change.type))
          .map((change) => change.originalLine ?? (change.indent ? change.indent + change.content : change.content))
          .join("\n")
      },

      // Helper function to validate using diff-match-patch
      getDMPSimilarity: (original: string, modified: string): number => {
        const dmp = new diff_match_patch()
        const diffs = dmp.diff_main(original, modified)
        dmp.diff_cleanupSemantic(diffs)
        const patches = dmp.patch_make(original, diffs)
        const [expectedText] = dmp.patch_apply(patches, original)

        const similarity = getStringSimilarity(expectedText, modified)
        return similarity
      },

      // Helper function to validate edit results using hunk information
      validateEditResult: (hunk: Hunk, result: string): number => {
        const expectedText = serviceMethods.getTextFromChanges(hunk.changes, ["context", "add"])
        const originalText = serviceMethods.getTextFromChanges(hunk.changes, ["context", "remove"])
        const similarity = serviceMethods.getDMPSimilarity(expectedText, result)
        const originalSimilarity = serviceMethods.getDMPSimilarity(originalText, result)

        if (originalSimilarity > 0.97 && similarity !== 1) {
          return 0.8 * similarity // Some confidence since we found the right location
        }
        return similarity
      },
      
      // Helper function to validate context lines against original content
      validateContextLines: (searchStr: string, candidateStr: string, fullContent: string[], confidenceThreshold: number): number => {
        const contextLines = searchStr.split("\n").filter((line) => !line.startsWith("-"))
        const similarity = getStringSimilarity(contextLines.join("\n"), candidateStr)
        const threshold = serviceMethods.getAdaptiveThreshold(fullContent.length, confidenceThreshold)
        const uniquenessScore = serviceMethods.evaluateContentUniqueness(searchStr, fullContent)
        const uniquenessBoost = uniquenessScore * UNIQUE_CONTENT_BOOST

        return similarity < threshold ? similarity * 0.3 + uniquenessBoost : similarity + uniquenessBoost
      },

      // Helper function to calculate match confidence
      calculateMatchConfidence: (searchStr: string, candidateStr: string, fullContent: string[], confidenceThreshold: number): number => {
        const dmpSimilarity = serviceMethods.getDMPSimilarity(searchStr, candidateStr);
        const contextSimilarity = serviceMethods.validateContextLines(searchStr, candidateStr, fullContent, confidenceThreshold);
        return Math.min(dmpSimilarity, contextSimilarity);
      },
      
      // Helper function to create overlapping windows
      createOverlappingWindows: (
        content: string[],
        searchSize: number,
        overlapSize: number = DEFAULT_OVERLAP_SIZE,
      ): { window: string[]; startIndex: number }[] => {
        const windows: { window: string[]; startIndex: number }[] = []

        // Ensure minimum window size is at least searchSize
        const effectiveWindowSize = Math.max(searchSize, Math.min(searchSize * 2, MAX_WINDOW_SIZE))

        // Ensure overlap size doesn't exceed window size
        const effectiveOverlapSize = Math.min(overlapSize, effectiveWindowSize - 1)

        // Calculate step size, ensure it's at least 1
        const stepSize = Math.max(1, effectiveWindowSize - effectiveOverlapSize)

        for (let i = 0; i < content.length; i += stepSize) {
          const windowContent = content.slice(i, i + effectiveWindowSize)
          if (windowContent.length >= searchSize) {
            windows.push({ window: windowContent, startIndex: i })
          }
        }

        return windows
      },

      // Helper function to combine overlapping matches
      combineOverlappingMatches: (
        matches: (SearchResult & { windowIndex: number })[],
        overlapSize: number = DEFAULT_OVERLAP_SIZE,
      ): SearchResult[] => {
        if (matches.length === 0) {
          return []
        }

        // Sort matches by confidence
        matches.sort((a, b) => b.confidence - a.confidence)

        const combinedMatches: SearchResult[] = []
        const usedIndices = new Set<number>()

        for (const match of matches) {
          if (usedIndices.has(match.windowIndex)) {
            continue
          }

          // Find overlapping matches
          const overlapping = matches.filter(
            (m) =>
              Math.abs(m.windowIndex - match.windowIndex) === 1 &&
              Math.abs(m.index - match.index) <= overlapSize &&
              !usedIndices.has(m.windowIndex),
          )

          if (overlapping.length > 0) {
            // Boost confidence if we find same match in overlapping windows
            const avgConfidence =
              (match.confidence + overlapping.reduce((sum, m) => sum + m.confidence, 0)) / (overlapping.length + 1)
            const boost = Math.min(0.05 * overlapping.length, 0.1) // Max 10% boost

            combinedMatches.push({
              index: match.index,
              confidence: Math.min(1, avgConfidence + boost),
              strategy: `${match.strategy}-overlapping`,
            })

            usedIndices.add(match.windowIndex)
            overlapping.forEach((m) => usedIndices.add(m.windowIndex))
          } else {
            combinedMatches.push({
              index: match.index,
              confidence: match.confidence,
              strategy: match.strategy,
            })
            usedIndices.add(match.windowIndex)
          }
        }

        return combinedMatches
      },

      findExactMatch: (
        searchStr: string,
        content: string[],
        startIndex: number = 0,
        confidenceThreshold: number = 0.97,
      ): SearchResult => {
        const searchLines = searchStr.split("\n")
        const windows = serviceMethods.createOverlappingWindows(content.slice(startIndex), searchLines.length)
        const matches: (SearchResult & { windowIndex: number })[] = []

        windows.forEach((windowData, windowIndex) => {
          const windowStr = windowData.window.join("\n")
          const exactMatch = windowStr.indexOf(searchStr)

          if (exactMatch !== -1) {
            const matchedContent = windowData.window
              .slice(
                windowStr.slice(0, exactMatch).split("\n").length - 1,
                windowStr.slice(0, exactMatch).split("\n").length - 1 + searchLines.length,
              )
              .join("\n")

            const confidence = serviceMethods.calculateMatchConfidence(searchStr, matchedContent, content, confidenceThreshold);

            matches.push({
              index: startIndex + windowData.startIndex + windowStr.slice(0, exactMatch).split("\n").length - 1,
              confidence,
              strategy: "exact",
              windowIndex,
            })
          }
        })

        const combinedMatches = serviceMethods.combineOverlappingMatches(matches)
        return combinedMatches.length > 0 ? combinedMatches[0] : { index: -1, confidence: 0, strategy: "exact" }
      },

      // String similarity strategy
      findSimilarityMatch: (
        searchStr: string,
        content: string[],
        startIndex: number = 0,
        confidenceThreshold: number = 0.97,
      ): SearchResult => {
        const searchLines = searchStr.split("\n")
        let bestScore = 0
        let bestIndex = -1

        for (let i = startIndex; i < content.length - searchLines.length + 1; i++) {
          const windowStr = content.slice(i, i + searchLines.length).join("\n")
          const score = getStringSimilarity(searchStr, windowStr)
          if (score > bestScore && score >= confidenceThreshold) {
            const confidence = serviceMethods.calculateMatchConfidence(searchStr, windowStr, content, confidenceThreshold);
            const adjustedScore = confidence * score

            if (adjustedScore > bestScore) {
              bestScore = adjustedScore
              bestIndex = i
            }
          }
        }

        return {
          index: bestIndex,
          confidence: bestIndex !== -1 ? bestScore : 0,
          strategy: "similarity",
        }
      },

      // Levenshtein strategy
      findLevenshteinMatch: (
        searchStr: string,
        content: string[],
        startIndex: number = 0,
        confidenceThreshold: number = 0.97,
      ): SearchResult => {
        const searchLines = searchStr.split("\n")
        const candidates = []

        for (let i = startIndex; i < content.length - searchLines.length + 1; i++) {
          candidates.push(content.slice(i, i + searchLines.length).join("\n"))
        }

        if (candidates.length > 0) {
          const closestMatch = closest(searchStr, candidates)
          const index = startIndex + candidates.indexOf(closestMatch)
          const confidence = serviceMethods.calculateMatchConfidence(searchStr, closestMatch, content, confidenceThreshold);
          return {
            index: confidence === 0 ? -1 : index,
            confidence: index !== -1 ? confidence : 0,
            strategy: "levenshtein",
          }
        }

        return { index: -1, confidence: 0, strategy: "levenshtein" }
      },

      // Helper function to identify anchor lines
      identifyAnchors: (searchStr: string): { first: string | null; last: string | null } => {
        const searchLines = searchStr.split("\n")
        let first: string | null = null
        let last: string | null = null

        // Find the first non-empty line
        for (const line of searchLines) {
          if (line.trim()) {
            first = line
            break
          }
        }

        // Find the last non-empty line
        for (let i = searchLines.length - 1; i >= 0; i--) {
          if (searchLines[i].trim()) {
            last = searchLines[i]
            break
          }
        }

        return { first, last }
      },

      // Anchor-based search strategy
      findAnchorMatch: (
        searchStr: string,
        content: string[],
        startIndex: number = 0,
        confidenceThreshold: number = 0.97,
      ): SearchResult => {
        const searchLines = searchStr.split("\n")
        const { first, last } = serviceMethods.identifyAnchors(searchStr)

        if (!first || !last) {
          return { index: -1, confidence: 0, strategy: "anchor" }
        }

        let firstIndex = -1
        let lastIndex = -1

        // Check if the first anchor is unique
        let firstOccurrences = 0
        for (const contentLine of content) {
          if (contentLine === first) {
            firstOccurrences++
          }
        }

        if (firstOccurrences !== 1) {
          return { index: -1, confidence: 0, strategy: "anchor" }
        }

        // Find the first anchor
        for (let i = startIndex; i < content.length; i++) {
          if (content[i] === first) {
            firstIndex = i
            break
          }
        }

        // Find the last anchor
        for (let i = content.length - 1; i >= startIndex; i--) {
          if (content[i] === last) {
            lastIndex = i
            break
          }
        }

        if (firstIndex === -1 || lastIndex === -1 || lastIndex <= firstIndex) {
          return { index: -1, confidence: 0, strategy: "anchor" }
        }

        // Validate the context
        const expectedContext = searchLines.slice(searchLines.indexOf(first) + 1, searchLines.indexOf(last)).join("\n")
        const actualContext = content.slice(firstIndex + 1, lastIndex).join("\n")
        const contextSimilarity = getStringSimilarity(expectedContext, actualContext)

        if (contextSimilarity < serviceMethods.getAdaptiveThreshold(content.length, confidenceThreshold)) {
          return { index: -1, confidence: 0, strategy: "anchor" }
        }

        const confidence = 1

        return {
          index: firstIndex,
          confidence: confidence,
          strategy: "anchor",
        }
      },

      // Main search function that tries all strategies
      findBestMatch: (
        searchStr: string,
        content: string[],
        startIndex: number = 0,
        confidenceThreshold: number = 0.97,
      ): SearchResult => {
        const strategies = [
          serviceMethods.findExactMatch,
          serviceMethods.findAnchorMatch,
          serviceMethods.findSimilarityMatch,
          serviceMethods.findLevenshteinMatch,
        ]

        let bestResult: SearchResult = { index: -1, confidence: 0, strategy: "none" }

        for (const strategy of strategies) {
          const result = strategy(searchStr, content, startIndex, confidenceThreshold)
          if (result.confidence > bestResult.confidence) {
            bestResult = result
          }
        }

        return bestResult
      },
    }
    return { searchStrategiesService: serviceMethods };
  });

const self = searchStrategiesService.searchStrategiesService
export const { findAnchorMatch, findExactMatch, findSimilarityMatch, findLevenshteinMatch, getTextFromChanges } = self
```

## File: src/strategies/new-unified/edit-strategies.service.ts
```typescript
import { diff_match_patch } from "diff-match-patch"
import type { EditResult, Hunk } from "./types"
import Alvamind from 'alvamind'
import { searchStrategiesService } from "./search-strategies.service"

interface EditStrategiesService {
  editStrategiesService: {
    applyPatch: (originalContent: string, searchContent: string, replaceContent: string) => string;
    applyThreeWayMerge: (baseContent: string, ourContent: string, theirContent: string) => string;
    applyContextMatching: (hunk: Hunk, content: string[], matchPosition: number) => EditResult;
    applyDMP: (hunk: Hunk, content: string[], matchPosition: number) => EditResult;
    applyInMemoryFallback: (hunk: Hunk, content: string[]) => Promise<EditResult>;
    applyEdit: (hunk: Hunk, content: string[], matchPosition: number, confidence: number, confidenceThreshold?: number) => Promise<EditResult>;
  }
}

export const editStrategiesService: EditStrategiesService = Alvamind({ name: 'edit-strategies.service' })
  .use(searchStrategiesService)
  .derive(({ searchStrategiesService: { validateEditResult, getTextFromChanges } }) => ({
    editStrategiesService: {

      applyPatch: (originalContent: string, searchContent: string, replaceContent: string): string => {
        try {
          const dmp = new diff_match_patch();

          // First, check if the search content exists in the original content
          const searchIndex = originalContent.indexOf(searchContent);
          if (searchIndex === -1) {
            // If search content isn't found, return original content unchanged
            return originalContent;
          }

          // Create a patch from search content to replace content
          const patch = dmp.patch_make(searchContent, replaceContent);

          // Apply the patch to the original content
          const [result, appliedPatches] = dmp.patch_apply(patch, originalContent);

          // Check if all patches were applied successfully
          const success = appliedPatches.every(Boolean);

          return success ? result : originalContent;
        } catch (error) {
          console.error("In-memory patch application failed:", error);
          return originalContent;
        }
      },

      applyThreeWayMerge: (baseContent: string, ourContent: string, theirContent: string): string => {
        try {
          const dmp = new diff_match_patch();

          // Check if base content exists in their content
          if (!theirContent.includes(baseContent)) {
            return theirContent; // Return unchanged if base content not found
          }

          // Create patches
          const ourPatch = dmp.patch_make(baseContent, ourContent);
          const theirPatch = dmp.patch_make(baseContent, theirContent);

          // Apply patches sequentially
          const [intermediateResult] = dmp.patch_apply(ourPatch, baseContent);
          const [finalResult, appliedPatches] = dmp.patch_apply(theirPatch, intermediateResult);

          const success = appliedPatches.every(Boolean);
          return success ? finalResult : theirContent;
        } catch (error) {
          console.error("In-memory three-way merge failed:", error);
          return theirContent;
        }
      }
      ,

      // Context matching edit strategy
      applyContextMatching: (hunk: Hunk, content: string[], matchPosition: number): EditResult => {
        if (matchPosition === -1) {
          return { confidence: 0, result: content, strategy: "context" }
        }

        const newResult = [...content.slice(0, matchPosition)]
        let sourceIndex = matchPosition

        for (const change of hunk.changes) {
          if (change.type === "context") {
            // Use the original line from content if available
            if (sourceIndex < content.length) {
              newResult.push(content[sourceIndex])
            } else {
              const line = change.indent ? change.indent + change.content : change.content
              newResult.push(line)
            }
            sourceIndex++
          } else if (change.type === "add") {
            // Use exactly the indentation from the change
            const baseIndent = change.indent || ""

            // Handle multi-line additions
            const lines = change.content.split("\n").map((line) => {
              // If the line already has indentation, preserve it relative to the base indent
              const lineIndentMatch = line.match(/^(\s*)(.*)/)
              if (lineIndentMatch) {
                const [, lineIndent, content] = lineIndentMatch
                // Only add base indent if the line doesn't already have it
                return lineIndent ? line : baseIndent + content
              }
              return baseIndent + line
            })

            newResult.push(...lines)
          } else if (change.type === "remove") {
            // Handle multi-line removes by incrementing sourceIndex for each line
            const removedLines = change.content.split("\n").length
            sourceIndex += removedLines
          }
        }

        // Append remaining content
        newResult.push(...content.slice(sourceIndex))

        // Calculate confidence based on the actual changes
        const afterText = newResult.slice(matchPosition, newResult.length - (content.length - sourceIndex)).join("\n")

        const confidence = validateEditResult(hunk, afterText)

        return {
          confidence,
          result: newResult,
          strategy: "context",
        }
      },

      // DMP edit strategy
      applyDMP: (hunk: Hunk, content: string[], matchPosition: number): EditResult => {
        if (matchPosition === -1) {
          return { confidence: 0, result: content, strategy: "dmp" }
        }

        const dmp = new diff_match_patch()

        const beforeText = getTextFromChanges(hunk.changes, ["context", "remove"])
        const afterText = getTextFromChanges(hunk.changes, ["context", "add"])

        // Calculate total lines in before block accounting for multi-line content
        const beforeLineCount = beforeText.split("\n").length

        // Create and apply patch
        const patch = dmp.patch_make(beforeText, afterText)
        const targetText = content.slice(matchPosition, matchPosition + beforeLineCount).join("\n")
        const [patchedText] = dmp.patch_apply(patch, targetText)

        // Split result and preserve line endings
        const patchedLines = patchedText.split("\n")

        // Construct final result
        const newResult = [
          ...content.slice(0, matchPosition),
          ...patchedLines,
          ...content.slice(matchPosition + beforeLineCount),
        ]

        const confidence = validateEditResult(hunk, patchedText)

        return {
          confidence,
          result: newResult,
          strategy: "dmp",
        }
      },

      // In-memory fallback strategy (replacing the Git-based one)
      applyInMemoryFallback: async (hunk: Hunk, content: string[]): Promise<EditResult> => {
        try {
          const searchText = getTextFromChanges(hunk.changes, ["context", "remove"]);
          const replaceText = getTextFromChanges(hunk.changes, ["context", "add"]);
          const originalText = content.join("\n");

          // Check if the search content exists in the original content
          if (!originalText.includes(searchText)) {
            return {
              confidence: 0,
              result: content,
              strategy: "in-memory-fallback"
            };
          }

          // Try direct patch application first
          let result = self.applyPatch(originalText, searchText, replaceText);

          // If the first strategy doesn't work, try the three-way merge
          if (result === originalText) {
            result = self.applyThreeWayMerge(searchText, replaceText, originalText);
          }

          // If we got a result different from the original, consider it successful
          if (result !== originalText) {
            const newLines = result.split("\n");
            const confidence = validateEditResult(hunk, result);

            return {
              confidence: Math.max(confidence, 0.8),
              result: newLines,
              strategy: "in-memory-fallback",
            };
          }

          // If no changes were applied, return original with 0 confidence
          return {
            confidence: 0,
            result: content,
            strategy: "in-memory-fallback"
          };
        } catch (error) {
          console.error("In-memory fallback strategy failed:", error);
          return {
            confidence: 0,
            result: content,
            strategy: "in-memory-fallback"
          };
        }
      },

      // Main edit function that tries strategies sequentially
      applyEdit: async (
        hunk: Hunk,
        content: string[],
        matchPosition: number,
        confidence: number,
        confidenceThreshold: number = 0.97,
      ): Promise<EditResult> => {
        // Don't attempt regular edits if confidence is too low
        if (confidence < confidenceThreshold) {
          console.log(
            `Search confidence (${confidence}) below minimum threshold (${confidenceThreshold}), trying in-memory fallback...`,
          )
          return await self.applyInMemoryFallback(hunk, content)
        }

        // Try each strategy in sequence until one succeeds
        const strategies = [
          { name: "dmp", apply: () => self.applyDMP(hunk, content, matchPosition) },
          { name: "context", apply: () => self.applyContextMatching(hunk, content, matchPosition) },
          { name: "in-memory-fallback", apply: () => self.applyInMemoryFallback(hunk, content) },
        ]

        // Try strategies sequentially until one succeeds
        for (const strategy of strategies) {
          const result = await (strategy.apply() as Promise<EditResult>)
          if (result.confidence >= confidenceThreshold) {
            return result
          }
        }

        return { confidence: 0, result: content, strategy: "none" }
      },
    }
  }))

const self = editStrategiesService.editStrategiesService
export const { applyContextMatching, applyDMP, applyInMemoryFallback } = self
```

## File: src/strategies/new-unified/index.ts
```typescript
import { Diff, Hunk, Change } from "./types"
import { ApplyDiffParams, DiffResult } from "../../types"
import Alvamind from 'alvamind';
import { editStrategiesService } from "./edit-strategies.service";
import { searchStrategiesService } from "./search-strategies.service";

interface NewUnifiedDiffStrategyService {
  newUnifiedDiffStrategyService: {
    confidenceThreshold: number;
    create: (confidenceThreshold?: number) => {
      confidenceThreshold: number;
      parseUnifiedDiff: (diff: string) => Diff;
      getToolDescription: (args: {
        cwd: string;
        toolOptions?: {
          [key: string]: string;
        };
      }) => string;
      splitHunk: (hunk: Hunk) => Hunk[];
      applyDiff: ({ originalContent, diffContent, startLine, endLine, }: ApplyDiffParams) => Promise<DiffResult>;
    };
  }
}

export const newUnifiedDiffStrategyService: NewUnifiedDiffStrategyService = Alvamind({ name: 'new-unified-diff-strategy.service' })
  .use(editStrategiesService)
  .use(searchStrategiesService)
  .derive(({ editStrategiesService: { applyEdit }, searchStrategiesService: { findBestMatch, getTextFromChanges } }) => ({
    newUnifiedDiffStrategyService: {

      confidenceThreshold: 1,

      create: (confidenceThreshold: number = 1) => {
        const confidenceThresholdValue = Math.max(confidenceThreshold, 0.8);

        const parseUnifiedDiff = (diff: string): Diff => {
          const MAX_CONTEXT_LINES = 6 // Number of context lines to keep before/after changes
          const lines = diff.split("\n")
          const hunks: Hunk[] = []
          let currentHunk: Hunk | null = null

          let i = 0
          while (i < lines.length && !lines[i].startsWith("@@")) {
            i++
          }

          for (; i < lines.length; i++) {
            const line = lines[i]

            if (line.startsWith("@@")) {
              if (
                currentHunk &&
                currentHunk.changes.length > 0 &&
                currentHunk.changes.some((change) => change.type === "add" || change.type === "remove")
              ) {
                const changes = currentHunk.changes
                let startIdx = 0
                let endIdx = changes.length - 1

                for (let j = 0; j < changes.length; j++) {
                  if (changes[j].type !== "context") {
                    startIdx = Math.max(0, j - MAX_CONTEXT_LINES)
                    break
                  }
                }

                for (let j = changes.length - 1; j >= 0; j--) {
                  if (changes[j].type !== "context") {
                    endIdx = Math.min(changes.length - 1, j + MAX_CONTEXT_LINES)
                    break
                  }
                }

                currentHunk.changes = changes.slice(startIdx, endIdx + 1)
                hunks.push(currentHunk)
              }
              currentHunk = { changes: [] }
              continue
            }

            if (!currentHunk) {
              continue
            }

            const content = line.slice(1)
            const indentMatch = content.match(/^(\s*)/)
            const indent = indentMatch ? indentMatch[0] : ""
            const trimmedContent = content.slice(indent.length)

            if (line.startsWith(" ")) {
              currentHunk.changes.push({
                type: "context",
                content: trimmedContent,
                indent,
                originalLine: content,
              })
            } else if (line.startsWith("+")) {
              currentHunk.changes.push({
                type: "add",
                content: trimmedContent,
                indent,
                originalLine: content,
              })
            } else if (line.startsWith("-")) {
              currentHunk.changes.push({
                type: "remove",
                content: trimmedContent,
                indent,
                originalLine: content,
              })
            } else {
              const finalContent = trimmedContent ? " " + trimmedContent : " "
              currentHunk.changes.push({
                type: "context",
                content: finalContent,
                indent,
                originalLine: content,
              })
            }
          }

          if (
            currentHunk &&
            currentHunk.changes.length > 0 &&
            currentHunk.changes.some((change) => change.type === "add" || change.type === "remove")
          ) {
            hunks.push(currentHunk)
          }

          return { hunks }
        };

        const getToolDescription = (args: { cwd: string; toolOptions?: { [key: string]: string } }): string => {
          return `# apply_diff Tool - Generate Precise Code Changes

Generate a unified diff that can be cleanly applied to modify code files.

## Step-by-Step Instructions:

1. Start with file headers:
   - First line: "--- {original_file_path}"
   - Second line: "+++ {new_file_path}"

2. For each change section:
   - Begin with "@@ ... @@" separator line without line numbers
   - Include 2-3 lines of context before and after changes
   - Mark removed lines with "-"
   - Mark added lines with "+"
   - Preserve exact indentation

3. Group related changes:
   - Keep related modifications in the same hunk
   - Start new hunks for logically separate changes
   - When modifying functions/methods, include the entire block

## Requirements:

1. MUST include exact indentation
2. MUST include sufficient context for unique matching
3. MUST group related changes together
4. MUST use proper unified diff format
5. MUST NOT include timestamps in file headers
6. MUST NOT include line numbers in the @@ header

## Examples:

✅ Good diff (follows all requirements):
\`\`\`diff
--- src/utils.ts
+++ src/utils.ts
@@ ... @@
    def calculate_total(items):
-      total = 0
-      for item in items:
-          total += item.price
+      return sum(item.price for item in items)
\`\`\`

❌ Bad diff (violates requirements #1 and #2):
\`\`\`diff
--- src/utils.ts
+++ src/utils.ts
@@ ... @@
-total = 0
-for item in items:
+return sum(item.price for item in items)
\`\`\`

Parameters:
- path: (required) File path relative to ${args.cwd}
- diff: (required) Unified diff content in unified format to apply to the file.

Usage:
<apply_diff>
<path>path/to/file.ext</path>
<diff>
Your diff here
</diff>
</apply_diff>`;
        };

        const splitHunk = (hunk: Hunk): Hunk[] => {
          const result: Hunk[] = []
          let currentHunk: Hunk | null = null
          let contextBefore: Change[] = []
          let contextAfter: Change[] = []
          const MAX_CONTEXT_LINES = 3 // Keep 3 lines of context before/after changes

          for (let i = 0; i < hunk.changes.length; i++) {
            const change = hunk.changes[i]

            if (change.type === "context") {
              if (!currentHunk) {
                contextBefore.push(change)
                if (contextBefore.length > MAX_CONTEXT_LINES) {
                  contextBefore.shift()
                }
              } else {
                contextAfter.push(change)
                if (contextAfter.length > MAX_CONTEXT_LINES) {
                  // We've collected enough context after changes, create a new hunk
                  currentHunk.changes.push(...contextAfter)
                  result.push(currentHunk)
                  currentHunk = null
                  // Keep the last few context lines for the next hunk
                  contextBefore = contextAfter
                  contextAfter = []
                }
              }
            } else {
              if (!currentHunk) {
                currentHunk = { changes: [...contextBefore] }
                contextAfter = []
              } else if (contextAfter.length > 0) {
                // Add accumulated context to current hunk
                currentHunk.changes.push(...contextAfter)
                contextAfter = []
              }
              currentHunk.changes.push(change)
            }
          }

          // Add any remaining changes
          if (currentHunk) {
            if (contextAfter.length > 0) {
              currentHunk.changes.push(...contextAfter)
            }
            result.push(currentHunk)
          }

          return result
        };

        const processHunk = async (hunk: Hunk, content: string[]) => {
          const contextStr = getTextFromChanges(hunk.changes, ["context", "remove"]);
          const searchResult = findBestMatch(contextStr, content, 0, confidenceThresholdValue);

          if (searchResult.confidence < confidenceThresholdValue) {
            return { success: false, type: 'search' as const, searchResult, hunk };
          }

          const editResult = await applyEdit(hunk, content, searchResult.index, searchResult.confidence, confidenceThresholdValue);
          
          if (editResult.confidence < confidenceThresholdValue) {
            return { success: false, type: 'edit' as const, editResult };
          }

          return { success: true, result: editResult.result };
        };

        const applyDiff = async (
          {
            originalContent,
            diffContent,
            startLine,
            endLine,
          }: ApplyDiffParams
        ): Promise<DiffResult> => {
          const parsedDiff = parseUnifiedDiff(diffContent)
          const originalLines = originalContent.split("\n")
          let result = [...originalLines]

          if (!parsedDiff.hunks.length) {
            return {
              success: false,
              error: "No hunks found in diff. Please ensure your diff includes actual changes and follows the unified diff format.",
            }
          }

          for (const hunk of parsedDiff.hunks) {
            const processResult = await processHunk(hunk, result);
            if (processResult.success) {
                result = processResult.result;
                continue;
            }

            // If main hunk fails, try sub-hunks
            console.log("Full hunk application failed, trying sub-hunks strategy")
            const subHunks = splitHunk(hunk)
            let subHunkResult = [...result]
            let allSubHunksApplied = true;

            for (const subHunk of subHunks) {
              const subProcessResult = await processHunk(subHunk, subHunkResult);
              if (subProcessResult.success) {
                subHunkResult = subProcessResult.result;
              } else {
                allSubHunksApplied = false;
                break;
              }
            }

            if (allSubHunksApplied && subHunks.length > 0) {
              result = subHunkResult
              continue
            }
            
            // Both failed, report error from original hunk failure
            let errorMsg: string;
            if (processResult.type === 'search') {
              const { searchResult, hunk: failedHunk } = processResult;
              const contextLines = failedHunk.changes.filter((c) => c.type === "context").length;
              const totalLines = failedHunk.changes.length;
              const contextRatio = totalLines > 0 ? contextLines / totalLines : 0;

              errorMsg = `Failed to find a matching location in the file (${Math.floor(
                searchResult.confidence * 100,
              )}% confidence, needs ${Math.floor(confidenceThresholdValue * 100)}%)\n\n`
              errorMsg += "Debug Info:\n"
              errorMsg += `- Search Strategy Used: ${searchResult.strategy}\n`
              errorMsg += `- Context Lines: ${contextLines} out of ${totalLines} total lines (${Math.floor(
                contextRatio * 100,
              )}%)\n`
              errorMsg += `- Attempted to split into ${subHunks.length} sub-hunks but still failed\n`

              if (contextRatio < 0.2) {
                errorMsg += "\nPossible Issues:\n- Not enough context lines to uniquely identify the location\n- Add a few more lines of unchanged code around your changes\n"
              } else if (contextRatio > 0.5) {
                errorMsg += "\nPossible Issues:\n- Too many context lines may reduce search accuracy\n- Try to keep only 2-3 lines of context before and after changes\n"
              } else {
                errorMsg += "\nPossible Issues:\n- The diff may be targeting a different version of the file\n- There may be too many changes in a single hunk, try splitting the changes into multiple hunks\n"
              }

              if (startLine && endLine) {
                errorMsg += `\nSearch Range: lines ${startLine}-${endLine}\n`
              }
            } else { // type is 'edit'
              const { editResult } = processResult;
              errorMsg = `Failed to apply the edit using ${editResult.strategy} strategy (${Math.floor(
                editResult.confidence * 100,
              )}% confidence)\n\n`
              errorMsg += "Debug Info:\n"
              errorMsg += "- The location was found but the content didn't match exactly\n"
              errorMsg += "- This usually means the file has been modified since the diff was created\n"
              errorMsg += "- Or the diff may be targeting a different version of the file\n"
              errorMsg += "\nPossible Solutions:\n"
              errorMsg += "1. Refresh your view of the file and create a new diff\n"
              errorMsg += "2. Double-check that the removed lines (-) match the current file content\n"
              errorMsg += "3. Ensure your diff targets the correct version of the file"
            }
            return { success: false, error: errorMsg };
          }

          return { success: true, content: result.join("\n") }
        };

        return {
          confidenceThreshold: confidenceThresholdValue,
          parseUnifiedDiff,
          getToolDescription,
          splitHunk,
          applyDiff,
        };
      },
    }
  }));

const self = newUnifiedDiffStrategyService.newUnifiedDiffStrategyService
export const { create, confidenceThreshold } = self
```

## File: package.json
```json
{
  "name": "diff-apply-alvamind",
  "version": "1.0.5",
  "description": "A utility for applying file diffs programmatically",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/diff-match-patch": "^1.0.36",
    "@types/tmp": "^0.2.6"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@types/diff": "^7.0.1",
    "@types/string-similarity": "^4.0.2",
    "alvamind": "^1.0.13",
    "alvamind-tools": "^1.0.23",
    "apply-whole": "^0.1.6",
    "diff": "^7.0.0",
    "diff-match-patch": "^1.0.5",
    "fastest-levenshtein": "^1.0.16",
    "string-similarity": "^4.0.4"
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json || true",
    "prepublishOnly": "npm run build",
    "test": "bun test",
    "source": "generate-source output=documentation.md exclude=dist/,node_modules/,.git/",
    "commit": "commit",
    "clean": "clean",
    "split-code": "split-code source=combined.ts markers=src/,lib/ outputDir=./output",
    "publish-npm": "publish-npm patch"
  },
  "keywords": [
    "diff",
    "patch",
    "file",
    "text",
    "diff-apply"
  ],
  "author": "Alvamind",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/alvamind/diff-apply-alvamind.git"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

## File: src/strategies/multi-search-replace.service.ts
```typescript
// diff-apply-alvamind/src/strategies/multi-search-replace.service.ts
import { DiffResult, ApplyDiffParams } from "../types";
import Alvamind from 'alvamind';
import { textService } from "../utils/extract-text.service";

interface MultiSearchReplaceService {
  multiSearchReplaceService: {
    getSimilarity(original: string, search:string): number;
    getToolDescription(args: { cwd: string; toolOptions?: { [key: string]: string } }): string;
    applyDiff(params: ApplyDiffParams): DiffResult;
  };
}

const BUFFER_LINES = 40; // Number of extra context lines to show before and after matches

export const multiSearchReplaceService: MultiSearchReplaceService = Alvamind({ name: 'multi-search-replace.service' })
  .use(textService)
  .derive(({ textService: { addLineNumbers, everyLineHasLineNumbers, stripLineNumbers, getLevenshteinSimilarity } }) => {
    return {
      multiSearchReplaceService: {
        getSimilarity: getLevenshteinSimilarity,
        getToolDescription: (args: { cwd: string; toolOptions?: { [key: string]: string } }): string => {
          return `## apply_diff
Description: Request to replace existing code using search and replace blocks. This tool allows for precise, surgical replacements to files by specifying what content to search for and what to replace it with. It supports single or multiple replacements in one call. The SEARCH section must exactly match existing content including whitespace and indentation.

Parameters:
- path: (required) The path of the file to modify (relative to the current working directory ${args.cwd})
- diff: (required) The search/replace block(s) defining the changes.
- start_line: (optional) The line number where the search block starts. Use only for a single replacement.
- end_line: (optional) The line number where the search block ends. Use only for a single replacement.

Diff format:

**Mode 1: Multiple replacements (or single with embedded line numbers)**
Each block must contain its own line numbers.
\`\`\`
<<<<<<< SEARCH
:start_line: (required) The line number of original content where the search block starts.
:end_line: (required) The line number of original content where the search block ends.
-------
[exact content to find including whitespace]
=======
[new content to replace with]
>>>>>>> REPLACE
... more blocks ...
\`\`\`

**Mode 2: Single replacement (using top-level start_line/end_line parameters)**
The diff block should not contain line numbers.
\`\`\`
<<<<<<< SEARCH
[exact content to find including whitespace]
=======
[new content to replace with]
>>>>>>> REPLACE
\`\`\`

Example (Mode 1 - multiple edits):
\`\`\`
<<<<<<< SEARCH
:start_line:2
:end_line:2
-------
sum = 0
=======
total = 0
>>>>>>> REPLACE

<<<<<<< SEARCH
:start_line:4
:end_line:5
-------
total += item
return total
=======
sum += item
return sum
>>>>>>> REPLACE
\`\`\`

Example (Mode 2 - single edit with params):
(Use with <start_line>1</start_line> and <end_line>5</end_line>)
\`\`\`
<<<<<<< SEARCH
def calculate_total(items):
total = 0
for item in items:
total += item
return total
=======
def calculate_total(items):
"""Calculate total with 10% markup"""
return sum(item * 1.1 for item in items)
>>>>>>> REPLACE
\`\`\`

Usage:
<apply_diff>
<path>File path here</path>
<diff>
Your search/replace content here
</diff>
<!-- For Mode 2, add start/end line numbers here -->
</apply_diff>`;
        },

        applyDiff: (
          {
            originalContent,
            diffContent,
            fuzzyThreshold = 1.0,
            bufferLines = BUFFER_LINES,
            startLine: paramStartLine,
            endLine: paramEndLine,
          }: ApplyDiffParams
        ): DiffResult => {
          let replacements;
          const initialResultLines = originalContent.split(/\r?\n/);

          if (paramStartLine !== undefined && paramEndLine !== undefined) {
            // Mode: single search/replace from search-replace.service
            const match = diffContent.match(/<<<<<<< SEARCH\n([\s\S]*?)\n?=======\n([\s\S]*?)\n?>>>>>>> REPLACE/);
            if (!match) {
              return {
                success: false,
                error: `Invalid diff format - missing required SEARCH/REPLACE sections\n\nDebug Info:\n- Expected Format: <<<<<<< SEARCH\\n[search content]\\n=======\n[replace content]\\n>>>>>>> REPLACE\n- Tip: Make sure to include both SEARCH and REPLACE sections with correct markers`,
              };
            }
            const [_, searchBody, replaceBody] = match;
            replacements = [{
              startLine: paramStartLine,
              endLine: paramEndLine,
              searchContent: searchBody,
              replaceContent: replaceBody,
            }];
          } else {
            // Mode: multi search/replace
            const matches = [...diffContent.matchAll(
              /<<<<<<< SEARCH\n(:start_line:\s*(\d+)\n){0,1}(:end_line:\s*(\d+)\n){0,1}(-------\n){0,1}([\s\S]*?)\n?=======\n([\s\S]*?)\n?>>>>>>> REPLACE/g,
            )];

            if (matches.length === 0) {
              return {
                success: false,
                error: `Invalid diff format - missing required sections\n\nDebug Info:\n- Expected Format: <<<<<<< SEARCH\\n:start_line: start line\\n:end_line: end line\\n-------\\n[search content]\\n=======\\n[replace content]\\n>>>>>>> REPLACE\n- Tip: Make sure to include start_line/end_line/SEARCH/REPLACE sections with correct markers`,
              };
            }
            replacements = matches
              .map((match) => ({
                startLine: Number(match[2] ?? 0),
                endLine: Number(match[4] ?? initialResultLines.length),
                searchContent: match[6],
                replaceContent: match[7],
              }))
              .sort((a, b) => a.startLine - b.startLine);
          }

          const lineEnding = originalContent.includes("\r\n") ? "\r\n" : "\n";
          let resultLines = [...initialResultLines];
          let delta = 0;
          let diffResults: DiffResult[] = [];
          let appliedCount = 0;

          for (let { searchContent, replaceContent, startLine, endLine } of replacements) {
            startLine += startLine === 0 ? 0 : delta;
            endLine += delta;

            if (everyLineHasLineNumbers(searchContent) && everyLineHasLineNumbers(replaceContent)) {
              searchContent = stripLineNumbers(searchContent);
              replaceContent = stripLineNumbers(replaceContent);
            }

            const searchLines = searchContent === "" ? [] : searchContent.split(/\r?\n/);
            const replaceLines = replaceContent === "" ? [] : replaceContent.split(/\r?\n/);

            if (searchLines.length === 0 && !startLine) {
              diffResults.push({
                success: false,
                error: `Empty search content requires start_line to be specified\n\nDebug Info:\n- Empty search content is only valid for insertions at a specific line\n- For insertions, specify the line number where content should be inserted`,
              });
              continue;
            }

            if (searchLines.length === 0 && startLine && endLine && startLine !== endLine) {
              diffResults.push({
                success: false,
                error: `Empty search content requires start_line and end_line to be the same (got ${startLine}-${endLine})\n\nDebug Info:\n- Empty search content is only valid for insertions at a specific line\n- For insertions, use the same line number for both start_line and end_line`,
              });
              continue;
            }

            let matchIndex = -1;
            let bestMatchScore = 0;
            let bestMatchContent = "";
            const searchChunk = searchLines.join("\n");

            let searchStartIndex = 0;
            let searchEndIndex = resultLines.length;

            if (startLine && endLine) {
              const exactStartIndex = startLine - 1;
              const exactEndIndex = endLine - 1;

              if (exactStartIndex < 0 || exactEndIndex > resultLines.length || exactStartIndex > exactEndIndex) {
                diffResults.push({
                  success: false,
                  error: `Line range ${startLine}-${endLine} is invalid (file has ${resultLines.length} lines)\n\nDebug Info:\n- Requested Range: lines ${startLine}-${endLine}\n- File Bounds: lines 1-${resultLines.length}`,
                });
                continue;
              }
              const originalChunk = resultLines.slice(exactStartIndex, exactEndIndex + 1).join("\n");
              const similarity = getLevenshteinSimilarity(originalChunk, searchChunk);
              if (similarity >= fuzzyThreshold) {
                matchIndex = exactStartIndex;
                bestMatchScore = similarity;
                bestMatchContent = originalChunk;
              } else {
                searchStartIndex = Math.max(0, startLine - (bufferLines + 1));
                searchEndIndex = Math.min(resultLines.length, endLine + bufferLines);
              }
            }

            const checkMatch = (index: number) => {
              const originalChunk = resultLines.slice(index, index + searchLines.length).join("\n");
              const similarity = getLevenshteinSimilarity(originalChunk, searchChunk);
              if (similarity > bestMatchScore) {
                bestMatchScore = similarity;
                matchIndex = index;
                bestMatchContent = originalChunk;
              }
            };

            if (matchIndex === -1) {
              const midPoint = Math.floor((searchStartIndex + searchEndIndex) / 2);
              let leftIndex = midPoint;
              let rightIndex = midPoint + 1;

              while (leftIndex >= searchStartIndex || rightIndex <= searchEndIndex - searchLines.length) {
                if (leftIndex >= searchStartIndex) {
                  checkMatch(leftIndex);
                  leftIndex--;
                }

                if (rightIndex <= searchEndIndex - searchLines.length) {
                  checkMatch(rightIndex);
                  rightIndex++;
                }
              }
            }

            if (matchIndex === -1 || bestMatchScore < fuzzyThreshold) {
              const searchChunk = searchLines.join("\n")
              const originalContentSection =
                startLine !== undefined && endLine !== undefined
                  ? `\n\nOriginal Content:\n${addLineNumbers(
                    resultLines
                      .slice(
                        Math.max(0, startLine - 1 - bufferLines),
                        Math.min(resultLines.length, endLine + bufferLines),
                      )
                      .join("\n"),
                    Math.max(1, startLine - bufferLines),
                  )}`
                  : `\n\nOriginal Content:\n${addLineNumbers(resultLines.join("\n"))}`

              const bestMatchSection = bestMatchContent
                ? `\n\nBest Match Found:\n${addLineNumbers(bestMatchContent, matchIndex + 1)}`
                : `\n\nBest Match Found:\n(no match)`

              const lineRange =
                startLine || endLine
                  ? ` at ${startLine ? `start: ${startLine}` : "start"} to ${endLine ? `end: ${endLine}` : "end"}`
                  : ""

              diffResults.push({
                success: false,
                error: `No sufficiently similar match found${lineRange} (${Math.floor(bestMatchScore * 100)}% similar, needs ${Math.floor(fuzzyThreshold * 100)}%)\n\nDebug Info:\n- Similarity Score: ${Math.floor(bestMatchScore * 100)}%\n- Required Threshold: ${Math.floor(fuzzyThreshold * 100)}%\n- Search Range: ${startLine && endLine ? `lines ${startLine}-${endLine}` : "start to end"}\n- Tip: Use read_file to get the latest content of the file before attempting the diff again, as the file content may have changed\n\nSearch Content:\n${searchChunk}${bestMatchSection}${originalContentSection}`,
              })
              continue
            }

            const matchedLines = resultLines.slice(matchIndex, matchIndex + searchLines.length);
            const originalIndents = matchedLines.map((line) => {
              const match = line.match(/^[\t ]*/);
              return match ? match[0] : "";
            });

            const searchIndents = searchLines.map((line) => {
              const match = line.match(/^[\t ]*/);
              return match ? match[0] : "";
            });

            const indentedReplaceLines = replaceLines.map((line) => {
              const matchedIndent = originalIndents[0] || "";
              const currentIndentMatch = line.match(/^[\t ]*/);
              const currentIndent = currentIndentMatch ? currentIndentMatch[0] : "";
              const searchBaseIndent = searchIndents[0] || "";

              const searchBaseLevel = searchBaseIndent.length;
              const currentLevel = currentIndent.length;
              const relativeLevel = currentLevel - searchBaseLevel;
              const finalIndent =
                relativeLevel < 0
                  ? matchedIndent.slice(0, Math.max(0, matchedIndent.length + relativeLevel))
                  : matchedIndent + currentIndent.slice(searchBaseLevel);

              return finalIndent + line.trim();
            });

            const beforeMatch = resultLines.slice(0, matchIndex);
            const afterMatch = resultLines.slice(matchIndex + searchLines.length);
            resultLines = [...beforeMatch, ...indentedReplaceLines, ...afterMatch];
            delta = delta - matchedLines.length + replaceLines.length;
            appliedCount++;
          }
          const finalContent = resultLines.join(lineEnding);
          if (paramStartLine !== undefined) {
             if (appliedCount === 0 && diffResults.length > 0) {
              return diffResults[0];
             }
          }
          
          if (appliedCount === 0 && diffResults.length > 0) {
            return {
              success: false,
              failParts: diffResults,
            };
          }

          return {
            success: true,
            content: finalContent,
            failParts: diffResults.length > 0 ? diffResults : undefined,
          };
        },
      }
    }
  });
```
