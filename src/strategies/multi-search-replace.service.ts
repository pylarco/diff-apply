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
Description: Replaces existing code using one or more search-and-replace blocks. This tool is for precise, surgical replacements, where the SEARCH block must exactly match existing content, including whitespace and indentation.

Parameters:
- path: (required) The path of the file to modify (relative to the current working directory ${args.cwd}).
- diff: (required) The search/replace block(s) defining the changes.
- start_line: (optional) The line number where a single search block starts.
- end_line: (optional) The line number where a single search block ends.

Diff Format:

Use one or more of the following blocks in the 'diff' parameter.

\`\`\`
<<<<<<< SEARCH
// For multiple blocks, specify line numbers here.
// :start_line: (required) The line number of original content where the search block starts.
// :end_line: (required) The line number of original content where the search block ends.
// -------
[exact content to find, including whitespace]
=======
[new content to replace with]
>>>>>>> REPLACE
\`\`\`

- **Single Replacement**: You can provide \`start_line\` and \`end_line\` as top-level parameters instead of inside the \`SEARCH\` block.
- **Multiple Replacements**: Define \`start_line\` and \`end_line\` inside each \`SEARCH\` block.

Example (Multiple Edits):
\`\`\`
<<<<<<< SEARCH
:start_line: 2
:end_line: 2
-------
sum = 0
=======
total = 0
>>>>>>> REPLACE
<<<<<<< SEARCH
:start_line: 4
:end_line: 5
-------
total += item
return total
=======
sum += item
return sum
>>>>>>> REPLACE
\`\`\`

Usage:
<apply_diff>
<path>File path here</path>
<diff>
Your search/replace content here
</diff>
<!-- For a single replacement, you can optionally add start/end line numbers here -->
</apply_diff>`;
        },

        applyDiff: (
          params: ApplyDiffParams | string,
          diffContentParam?: string
        ): DiffResult => {
          let originalContent: string;
          let diffContent: string;
          let fuzzyThreshold = 1.0;
          let bufferLines = BUFFER_LINES;
          let paramStartLine: number | undefined;
          let paramEndLine: number | undefined;
          
          // Handle both function signatures
          if (typeof params === 'string' && typeof diffContentParam === 'string') {
            originalContent = params;
            diffContent = diffContentParam;
          } else if (typeof params === 'object') {
            originalContent = params.originalContent;
            diffContent = params.diffContent;
            fuzzyThreshold = params.fuzzyThreshold ?? 1.0;
            bufferLines = params.bufferLines ?? BUFFER_LINES;
            paramStartLine = params.startLine;
            paramEndLine = params.endLine;
          } else {
            return {
              success: false,
              error: "Invalid parameters provided",
            };
          }
          
          if (!originalContent || !diffContent) {
            return {
              success: false,
              error: "Missing required parameters: originalContent and diffContent",
            };
          }
          
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

export const { applyDiff, getToolDescription } = multiSearchReplaceService.multiSearchReplaceService;