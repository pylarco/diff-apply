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