This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.
The content has been processed where content has been formatted for parsing in markdown style.

# Directory Structure
```
package.json
src/global.d.ts
src/index.ts
src/insert-groups.ts
src/strategies/multi-search-replace.service.ts
src/strategies/new-unified/edit-strategies.service.ts
src/strategies/new-unified/index.ts
src/strategies/new-unified/search-strategies.service.ts
src/strategies/new-unified/types.ts
src/strategies/unified.service.ts
src/types.ts
src/utils/extract-text.service.ts
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

## File: src/utils/extract-text.service.ts
```typescript
// diff-apply-alvamind/src/extract-text.service.ts
import Alvamind from 'alvamind';

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
  });
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

## File: src/strategies/new-unified/search-strategies.service.ts
```typescript
import { compareTwoStrings } from "string-similarity"
import { closest } from "fastest-levenshtein"
import { diff_match_patch } from "diff-match-patch"
import { Change, Hunk } from "./types"
import Alvamind from 'alvamind';

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
  .derive(() => ({

    searchStrategiesService: {
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

      // Helper function to evaluate similarity between two texts
      evaluateSimilarity: (original: string, modified: string): number => {
        return compareTwoStrings(original, modified)
      },

      // Helper function to validate using diff-match-patch
      getDMPSimilarity: (original: string, modified: string): number => {
        const dmp = new diff_match_patch()
        const diffs = dmp.diff_main(original, modified)
        dmp.diff_cleanupSemantic(diffs)
        const patches = dmp.patch_make(original, diffs)
        const [expectedText] = dmp.patch_apply(patches, original)

        const similarity = self.evaluateSimilarity(expectedText, modified)
        return similarity
      },

      // Helper function to validate edit results using hunk information
      validateEditResult: (hunk: Hunk, result: string): number => {
        const expectedText = self.getTextFromChanges(hunk.changes, ["context", "add"])
        const originalText = self.getTextFromChanges(hunk.changes, ["context", "remove"])
        const similarity = self.getDMPSimilarity(expectedText, result)
        const originalSimilarity = self.getDMPSimilarity(originalText, result)

        if (originalSimilarity > 0.97 && similarity !== 1) {
          return 0.8 * similarity // Some confidence since we found the right location
        }
        return similarity
      },
      
      // Helper function to validate context lines against original content
      validateContextLines: (searchStr: string, candidateStr: string, fullContent: string[], confidenceThreshold: number): number => {
        const contextLines = searchStr.split("\n").filter((line) => !line.startsWith("-"))
        const similarity = self.evaluateSimilarity(contextLines.join("\n"), candidateStr)
        const threshold = self.getAdaptiveThreshold(fullContent.length, confidenceThreshold)
        const uniquenessScore = self.evaluateContentUniqueness(searchStr, fullContent)
        const uniquenessBoost = uniquenessScore * UNIQUE_CONTENT_BOOST

        return similarity < threshold ? similarity * 0.3 + uniquenessBoost : similarity + uniquenessBoost
      },

      // Helper function to calculate match confidence
      calculateMatchConfidence: (searchStr: string, candidateStr: string, fullContent: string[], confidenceThreshold: number): number => {
        const dmpSimilarity = self.getDMPSimilarity(searchStr, candidateStr);
        const contextSimilarity = self.validateContextLines(searchStr, candidateStr, fullContent, confidenceThreshold);
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
        const windows = self.createOverlappingWindows(content.slice(startIndex), searchLines.length)
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

            const confidence = self.calculateMatchConfidence(searchStr, matchedContent, content, confidenceThreshold);

            matches.push({
              index: startIndex + windowData.startIndex + windowStr.slice(0, exactMatch).split("\n").length - 1,
              confidence,
              strategy: "exact",
              windowIndex,
            })
          }
        })

        const combinedMatches = self.combineOverlappingMatches(matches)
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
          const score = compareTwoStrings(searchStr, windowStr)
          if (score > bestScore && score >= confidenceThreshold) {
            const confidence = self.calculateMatchConfidence(searchStr, windowStr, content, confidenceThreshold);
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
          const confidence = self.calculateMatchConfidence(searchStr, closestMatch, content, confidenceThreshold);
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
        const { first, last } = self.identifyAnchors(searchStr)

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
        const contextSimilarity = self.evaluateSimilarity(expectedContext, actualContext)

        if (contextSimilarity < self.getAdaptiveThreshold(content.length, confidenceThreshold)) {
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
          self.findExactMatch,
          self.findAnchorMatch,
          self.findSimilarityMatch,
          self.findLevenshteinMatch,
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
  }));

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
import { distance } from "fastest-levenshtein";
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
  .derive(({ textService: { addLineNumbers, everyLineHasLineNumbers, stripLineNumbers } }) => {
    const self = {
      getSimilarity: (original: string, search: string): number => {
        if (search === "") {
          return 1;
        }

        const normalizeStr = (str: string) => str.replace(/\s+/g, " ").trim();

        const normalizedOriginal = normalizeStr(original);
        const normalizedSearch = normalizeStr(search);

        if (normalizedOriginal === normalizedSearch) {
          return 1;
        }

        const dist = distance(normalizedOriginal, normalizedSearch);
        const maxLength = Math.max(normalizedOriginal.length, normalizedSearch.length);
        return 1 - dist / maxLength;
      }
    };

    return {
      multiSearchReplaceService: {
        getSimilarity: self.getSimilarity,
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
              const similarity = self.getSimilarity(originalChunk, searchChunk);
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
              const similarity = self.getSimilarity(originalChunk, searchChunk);
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
