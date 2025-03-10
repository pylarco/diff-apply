// diff-apply-alvamind/src/strategies/search-replace.service.ts
import { distance } from "fastest-levenshtein";
import Alvamind from 'alvamind';
import { textService } from "../utils/extract-text.service";
import { ApplyDiffParams, DiffResult } from "../types";

const BUFFER_LINES = 20; // Number of extra context lines to show before and after matches

export const searchReplaceService = Alvamind({ name: 'search-replace.service' })
  .use(textService)
  .derive(({ textService: { addLineNumbers, everyLineHasLineNumbers, stripLineNumbers } }) => ({
    searchReplaceService: {
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

      ,
      getToolDescription: (args: { cwd: string; toolOptions?: { [key: string]: string } }): string => {
        return `## apply_diff
Description: Request to replace existing code using a search and replace block.
This tool allows for precise, surgical replaces to files by specifying exactly what content to search for and what to replace it with.
The tool will maintain proper indentation and formatting while making changes.
Only a single operation is allowed per tool use.
The SEARCH section must exactly match existing content including whitespace and indentation.
If you're not confident in the exact content to search for, use the read_file tool first to get the exact content.
When applying the diffs, be extra careful to remember to change any closing brackets or other syntax that may be affected by the diff farther down in the file.

Parameters:
- path: (required) The path of the file to modify (relative to the current working directory ${args.cwd})
- diff: (required) The search/replace block defining the changes.
- start_line: (required) The line number where the search block starts.
- end_line: (required) The line number where the search block ends.

Diff format:
\`\`\`
<<<<<<< SEARCH
[exact content to find including whitespace]
=======
[new content to replace with]
>>>>>>> REPLACE
\`\`\`

Example:

Original file:
\`\`\`
1 | def calculate_total(items):
2 |     total = 0
3 |     for item in items:
4 |         total += item
5 |     return total
\`\`\`

Search/Replace content:
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
<start_line>1</start_line>
<end_line>5</end_line>
</apply_diff>`;
      },

      applyDiff: (
        {
          originalContent,
          diffContent,
          fuzzyThreshold = 1.0,
          bufferLines = BUFFER_LINES,
          startLine,
          endLine,
        }: ApplyDiffParams
      ): DiffResult => {
        const match = diffContent.match(/<<<<<<< SEARCH\n([\s\S]*?)\n?=======\n([\s\S]*?)\n?>>>>>>> REPLACE/);
        if (!match) {
          return {
            success: false,
            error: `Invalid diff format - missing required SEARCH/REPLACE sections\n\nDebug Info:\n- Expected Format: <<<<<<< SEARCH\\n[search content]\\n=======\\n[replace content]\\n>>>>>>> REPLACE\n- Tip: Make sure to include both SEARCH and REPLACE sections with correct markers`,
          };
        }

        let [_, searchContent, replaceContent] = match;
        const lineEnding = originalContent.includes("\r\n") ? "\r\n" : "\n";

        if (everyLineHasLineNumbers(searchContent) && everyLineHasLineNumbers(replaceContent)) {
          searchContent = stripLineNumbers(searchContent);
          replaceContent = stripLineNumbers(replaceContent);
        }

        const searchLines = searchContent === "" ? [] : searchContent.split(/\r?\n/);
        const replaceLines = replaceContent === "" ? [] : replaceContent.split(/\r?\n/);
        const originalLines = originalContent.split(/\r?\n/);

        if (searchLines.length === 0 && !startLine) {
          return {
            success: false,
            error: `Empty search content requires start_line to be specified\n\nDebug Info:\n- Empty search content is only valid for insertions at a specific line\n- For insertions, specify the line number where content should be inserted`,
          };
        }

        if (searchLines.length === 0 && startLine && endLine && startLine !== endLine) {
          return {
            success: false,
            error: `Empty search content requires start_line and end_line to be the same (got ${startLine}-${endLine})\n\nDebug Info:\n- Empty search content is only valid for insertions at a specific line\n- For insertions, use the same line number for both start_line and end_line`,
          };
        }

        let matchIndex = -1;
        let bestMatchScore = 0;
        let bestMatchContent = "";
        const searchChunk = searchLines.join("\n");

        let searchStartIndex = 0;
        let searchEndIndex = originalLines.length;

        if (startLine && endLine) {
          const exactStartIndex = startLine - 1;
          const exactEndIndex = endLine - 1;

          if (exactStartIndex < 0 || exactEndIndex > originalLines.length || exactStartIndex > exactEndIndex) {
            return {
              success: false,
              error: `Line range ${startLine}-${endLine} is invalid (file has ${originalLines.length} lines)\n\nDebug Info:\n- Requested Range: lines ${startLine}-${endLine}\n- File Bounds: lines 1-${originalLines.length}`,
            };
          }

          const originalChunk = originalLines.slice(exactStartIndex, exactEndIndex + 1).join("\n");
          const similarity = self.getSimilarity(originalChunk, searchChunk);
          if (similarity >= fuzzyThreshold) {
            matchIndex = exactStartIndex;
            bestMatchScore = similarity;
            bestMatchContent = originalChunk;
          } else {
            searchStartIndex = Math.max(0, startLine - (bufferLines + 1));
            searchEndIndex = Math.min(originalLines.length, endLine + bufferLines);
          }
        }

        if (matchIndex === -1) {
          const midPoint = Math.floor((searchStartIndex + searchEndIndex) / 2);
          let leftIndex = midPoint;
          let rightIndex = midPoint + 1;

          while (leftIndex >= searchStartIndex || rightIndex <= searchEndIndex - searchLines.length) {
            if (leftIndex >= searchStartIndex) {
              const originalChunk = originalLines.slice(leftIndex, leftIndex + searchLines.length).join("\n");
              const similarity = self.getSimilarity(originalChunk, searchChunk);
              if (similarity > bestMatchScore) {
                bestMatchScore = similarity;
                matchIndex = leftIndex;
                bestMatchContent = originalChunk;
              }
              leftIndex--;
            }

            if (rightIndex <= searchEndIndex - searchLines.length) {
              const originalChunk = originalLines.slice(rightIndex, rightIndex + searchLines.length).join("\n");
              const similarity = self.getSimilarity(originalChunk, searchChunk);
              if (similarity > bestMatchScore) {
                bestMatchScore = similarity;
                matchIndex = rightIndex;
                bestMatchContent = originalChunk;
              }
              rightIndex++;
            }
          }
        }
        if (matchIndex === -1 || bestMatchScore < fuzzyThreshold) {
          const searchChunk = searchLines.join("\n");
          const originalContentSection =
            startLine !== undefined && endLine !== undefined
              ? `\n\nOriginal Content:\n${addLineNumbers(
                originalLines
                  .slice(
                    Math.max(0, startLine - 1 - bufferLines),
                    Math.min(originalLines.length, endLine + bufferLines),
                  )
                  .join("\n"),
                Math.max(1, startLine - bufferLines),
              )}`
              : `\n\nOriginal Content:\n${addLineNumbers(originalLines.join("\n"))}`;

          const bestMatchSection = bestMatchContent
            ? `\n\nBest Match Found:\n${addLineNumbers(bestMatchContent, matchIndex + 1)}`
            : `\n\nBest Match Found:\n(no match)`;

          const lineRange =
            startLine || endLine
              ? ` at ${startLine ? `start: ${startLine}` : "start"} to ${endLine ? `end: ${endLine}` : "end"}`
              : "";
          return {
            success: false,
            error: `No sufficiently similar match found${lineRange} (${Math.floor(bestMatchScore * 100)}% similar, needs ${Math.floor(fuzzyThreshold * 100)}%)\n\nDebug Info:\n- Similarity Score: ${Math.floor(bestMatchScore * 100)}%\n- Required Threshold: ${Math.floor(fuzzyThreshold * 100)}%\n- Search Range: ${startLine && endLine ? `lines ${startLine}-${endLine}` : "start to end"}\n- Tip: Use read_file to get the latest content of the file before attempting the diff again, as the file content may have changed\n\nSearch Content:\n${searchChunk}${bestMatchSection}${originalContentSection}`,
          };
        }

        const matchedLines = originalLines.slice(matchIndex, matchIndex + searchLines.length);

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

        const beforeMatch = originalLines.slice(0, matchIndex);
        const afterMatch = originalLines.slice(matchIndex + searchLines.length);

        const finalContent = [...beforeMatch, ...indentedReplaceLines, ...afterMatch].join(lineEnding);
        return {
          success: true,
          content: finalContent,
        };
      },
    }
  }));

const self = searchReplaceService.searchReplaceService
export const { applyDiff, getToolDescription, getSimilarity } = self;
