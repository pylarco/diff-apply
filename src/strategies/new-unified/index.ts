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
                result = processResult.result!;
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
                subHunkResult = subProcessResult.result!;
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
              errorMsg = `Failed to apply the edit using ${editResult?.strategy || 'unknown'} strategy (${Math.floor(
                (editResult?.confidence || 0) * 100,
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