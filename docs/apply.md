An analysis of the codebase has revealed opportunities to refactor and simplify by applying the "Don't Repeat Yourself" (DRY) principle, primarily by consolidating two very similar diffing strategies.

The `search-replace.service.ts` and `multi-search-replace.service.ts` files provide nearly identical functionality. The former is a specialized version of the latter, handling a single search-and-replace operation where line numbers are passed as external parameters. The latter handles multiple operations with line numbers embedded in the diff content. The underlying implementation in `multi-search-replace.service.ts` already accommodates both use cases.

To streamline the code, I will take the following steps:

1.  **Deprecate and remove `search-replace.service.ts`**: Its logic is fully contained within `multi-search-replace.service.ts`.
2.  **Enhance `multi-search-replace.service.ts`**: The tool description (`getToolDescription`) will be updated to be more comprehensive, explaining both single and multiple replacement modes. This makes the tool's documentation more accurate and versatile.
3.  **Update `src/index.ts`**: The public API will be preserved. The `searchReplaceService` and `searchReplaceDiffStrategy` exports will be aliased to the unified `multiSearchReplaceService` implementation, ensuring no breaking changes for consumers of the library.

This refactoring will significantly reduce the line count, eliminate redundant code, and simplify the overall structure of the library, adhering to the goal of a more concise and maintainable codebase.

```typescript // src/index.ts
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

```typescript // src/strategies/multi-search-replace.service.ts
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
            if (matchIndex === -1) {
              const midPoint = Math.floor((searchStartIndex + searchEndIndex) / 2);
              let leftIndex = midPoint;
              let rightIndex = midPoint + 1;

              while (leftIndex >= searchStartIndex || rightIndex <= searchEndIndex - searchLines.length) {
                if (leftIndex >= searchStartIndex) {
                  const originalChunk = resultLines.slice(leftIndex, leftIndex + searchLines.length).join("\n")
                  const similarity = self.getSimilarity(originalChunk, searchChunk)
                  if (similarity > bestMatchScore) {
                    bestMatchScore = similarity
                    matchIndex = leftIndex
                    bestMatchContent = originalChunk
                  }
                  leftIndex--
                }

                if (rightIndex <= searchEndIndex - searchLines.length) {
                  const originalChunk = resultLines.slice(rightIndex, rightIndex + searchLines.length).join("\n")
                  const similarity = self.getSimilarity(originalChunk, searchChunk)
                  if (similarity > bestMatchScore) {
                    bestMatchScore = similarity
                    matchIndex = rightIndex
                    bestMatchContent = originalChunk
                  }
                  rightIndex++
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

```typescript // src/strategies/search-replace.service.ts
//TODO: delete this file
```