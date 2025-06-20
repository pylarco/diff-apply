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