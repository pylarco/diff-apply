// diff-apply-alvamind/src/strategies/unified.service.ts
import { applyPatch } from "diff";
import { DiffResult } from "../types";
import Alvamind from 'alvamind';

export const unifiedDiffService = Alvamind({ name: 'unified-diff.service' })
  .derive(() => ({
    unifiedDiffService: {
      getToolDescription: (args: { cwd: string; toolOptions?: { [key: string]: string } }): string => {
        return `## apply_diff
Description: Apply a unified diff to a file at the specified path. This tool is useful for making specific modifications to a file based on a set of changes provided in the standard unified diff format (diff -U3).

Parameters:
- path: (required) The path of the file to apply the diff to (relative to the current working directory ${args.cwd}).
- diff: (required) The diff content in unified format to apply to the file.

Format Requirements:
1. Header: Must start with \`--- path/to/original/file\` and \`+++ path/to/modified/file\`. Timestamps are not allowed.
2. Hunks: Each change block (hunk) must start with \`@@ -old_line,count +new_line,count @@\`.
3. Line Prefixes:
   - Use '-' for removed lines.
   - Use '+' for added lines.
   - Use a space ' ' for unchanged context lines.
   - Indentation must be preserved exactly.

Example:
\`\`\`
--- src/utils/helper.ts
+++ src/utils/helper.ts
@@ -2,5 +2,5 @@
 function calculateTotal(items: number[]): number {
-  return items.reduce((sum, item) => {
-    return sum + item;
-  }, 0);
+  const total = items.reduce((sum, item) => sum + item * 1.1, 0); // Add 10% markup
+  return Math.round(total * 100) / 100; // Round to 2 decimal places
 }
\`\`\`

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
          // Check if the diff content has the required header lines
          if (!diffContent.match(/^---.*\n\+\+\+.*$/m)) {
            return {
              success: false,
              error: "Invalid unified diff format - missing header lines",
              details: {
                searchContent: diffContent,
              },
            };
          }

          // Check for valid hunk headers
          if (!diffContent.match(/@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/)) {
            return {
              success: false,
              error: "Invalid unified diff format - missing hunk headers",
              details: {
                searchContent: diffContent,
              },
            };
          }

          // Apply the patch
          const result = applyPatch(originalContent, diffContent);
          
          // Handle the result
          if (result === false) {
            // Try to provide a more helpful error message
            return {
              success: false,
              error: "Failed to apply unified diff - patch rejected. Check that the line numbers match the current file content.",
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