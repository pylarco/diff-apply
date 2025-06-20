// diff-apply-alvamind/src/strategies/search-replace.service.ts
import Alvamind from 'alvamind';
import { ApplyDiffParams, DiffResult } from "../types";
import { multiSearchReplaceService } from './multi-search-replace.service';

interface SearchReplaceService {
  searchReplaceService: {
    getSimilarity: (original: string, search: string) => number;
    getToolDescription: (args: {
      cwd: string;
      toolOptions?: {
        [key: string]: string;
      };
    }) => string;
    applyDiff: (params: ApplyDiffParams) => DiffResult;
  }
}

export const searchReplaceService: SearchReplaceService = Alvamind({ name: 'search-replace.service' })
  .derive(() => ({
    searchReplaceService: {
      getSimilarity: multiSearchReplaceService.multiSearchReplaceService.getSimilarity,
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

      applyDiff: (params: ApplyDiffParams): DiffResult => {
        if (params.startLine === undefined || params.endLine === undefined) {
          return {
            success: false,
            error: `start_line and end_line are required for this diff strategy.`,
          };
        }

        const result = multiSearchReplaceService.multiSearchReplaceService.applyDiff(params);

        // The multi-search-replace service returns a result that may contain failParts
        // for each block. Since this strategy only ever has one block, we can simplify
        // the result for the caller.
        if (result.success) {
          return { success: true, content: result.content };
        } else if (result.failParts && result.failParts.length > 0) {
          return result.failParts[0]; // Return the error for the single part that failed
        } else {
          return result; // Return other structural errors
        }
      },
    }
  }));