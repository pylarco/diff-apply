An excellent goal! Refactoring for DRY principles not only reduces code size but also improves maintainability and consistency. I've identified an opportunity to consolidate text similarity logic, which is currently duplicated across different strategy services.

By centralizing the similarity calculation functions into the existing `textService` utility, we can remove redundant code from both the `multi-search-replace.service.ts` and `new-unified/search-strategies.service.ts` files. This change will make the codebase cleaner and more modular without altering any functionality.

Here are the optimized code changes:

```typescript
// src/strategies/multi-search-replace.service.ts
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
```typescript
// src/strategies/new-unified/search-strategies.service.ts
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
```typescript
// src/utils/extract-text.service.ts
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