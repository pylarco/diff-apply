# diff-apply-alvamind

A utility for applying file diffs programmatically.

## Installation

```bash
npm install diff-apply-alvamind
```

## Usage

```typescript
import { applyDiff } from 'diff-apply-alvamind';

// Original content
const original = 'line1\nline2\nline3\n';

// Diff to apply
const diff = `@@ -1,3 +1,4 @@
 line1
-line2
+modified line2
+new line
 line3
`;

// Apply the diff
const result = applyDiff(original, diff);
console.log(result);
// Output: 'line1\nmodified line2\nnew line\nline3\n'
```

## API

### applyDiff(originalContent: string, diff: string): string

Applies a unified diff to the original content and returns the modified content.

## License

MIT
