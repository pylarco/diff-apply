I've analyzed the codebase for opportunities to make it significantly DRYer by reducing code duplication without introducing breaking changes. I've identified two key areas for refactoring that will improve code structure and reduce redundancy.

Here are the changes I'll be making:

1.  **In `src/strategies/multi-search-replace.service.ts`**: I'll refactor the search logic within the `applyDiff` method. The current implementation has a duplicated block of code for checking potential matches. I will extract this into a local helper function `checkMatch` to eliminate this repetition, making the search loop cleaner and more maintainable.

2.  **In `src/strategies/new-unified/index.ts`**: The `applyDiff` method contains repeated logic for applying changes for a full hunk and then again for sub-hunks if the initial attempt fails. This is a significant piece of duplication. I will introduce a `processHunk` helper function to encapsulate the "find and apply" logic. This new function will be used for both full hunks and sub-hunks, which greatly simplifies `applyDiff` and makes the entire process more robust and easier to follow. This change also resolves an inconsistency in the confidence threshold being used.

These changes will reduce the overall lines of code and improve the codebase's adherence to the DRY principle.

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
```typescript // src/strategies/new-unified/index.ts
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
  .derive(({ editStrategiesService: { applyEdit }, searchStrategiesService: { findBestMatch, prepareSearchString } }) => ({
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
          const contextStr = prepareSearchString(hunk.changes);
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