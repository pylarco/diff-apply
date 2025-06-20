# Advanced Diff and Patching Library for AI Agents

[![Build Status](https://img.shields.io/github/actions/workflow/status/your-username/your-repo/ci.yml?branch=main)](https://github.com/your-username/your-repo/actions)
[![npm version](https://badge.fury.io/js/advanced-diff-patcher.svg)](https://badge.fury.io/js/advanced-diff-patcher)
[![Coverage Status](https://coveralls.io/repos/github/your-username/your-repo/badge.svg?branch=main)](https://coveralls.io/github/your-username/your-repo?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

This library provides a powerful and resilient toolkit for applying code modifications, specifically designed for use in AI-powered developer agents and automated coding systems. It moves beyond simple patch application by offering multiple intelligent strategies to find the correct location for a change and apply it, even if the source file has been slightly modified.

This enhanced reliability reduces failed operations and provides detailed feedback, enabling AI agents to self-correct and perform more complex coding tasks successfully.

## Table of Contents

- [Key Features](#key-features)
- [Benefits](#benefits)
- [Core Concepts](#core-concepts)
  - [Diff Strategies](#diff-strategies)
  - [Confidence Scoring](#confidence-scoring)
  - [Detailed Error Feedback](#detailed-error-feedback)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Example](#basic-example)
  - [Choosing a Strategy](#choosing-a-strategy)
- [LLM Integration and Prompting Guide](#llm-integration-and-prompting-guide)
  - [Strategy 1: Advanced Unified Diff (`new-unified`)](#strategy-1-advanced-unified-diff-new-unified)
  - [Strategy 2: Multi-Search-Replace (`multi-search-replace`)](#strategy-2-multi-search-replace-multi-search-replace)
  - [Strategy 3: Standard Unified Diff (`unified`)](#strategy-3-standard-unified-diff-unified)
  - [Handling Failures and Self-Correction](#handling-failures-and-self-correction)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Key Features

-   **Multiple Patching Strategies**: Choose from three distinct strategies to best fit the task:
    1.  **Advanced Unified Diff**: A highly resilient strategy that uses fuzzy matching, confidence scoring, and intelligent search to apply unified diffs.
    2.  **Multi-Search-Replace**: A precise strategy for replacing specific blocks of code, supporting multiple replacements in a single operation.
    3.  **Standard Unified Diff**: A classic `diff -U` patch applicator for standard, unmodified diff files.
-   **Intelligent Search Algorithms**: The advanced strategy employs a cascade of search methods (exact match, anchor-based, string similarity, and Levenshtein distance) to robustly locate the target code block.
-   **Confidence Scoring**: Automatically calculates a confidence score for each potential match, ensuring patches are only applied when there is high certainty.
-   **Resilience to Code Drift**: Successfully applies patches even when line numbers have shifted or minor, unrelated changes have been made to the file.
-   **Detailed Error Feedback**: When a patch fails, the library provides structured, actionable error messages that an LLM can use to diagnose the problem and retry the operation.
-   **LLM Tool Integration**: Each strategy includes a `getToolDescription` method, providing ready-to-use descriptions for LLM agent frameworks (like function calling).

## Benefits

-   **Increased Reliability**: Drastically reduces the failure rate of AI-generated code modifications, leading to more autonomous and capable agents.
-   **Enhanced Precision**: Allows for surgical edits, from single-line changes to entire function refactors.
-   **Self-Correcting Agents**: The detailed error feedback loop empowers LLMs to understand their mistakes (e.g., "not enough context provided," "match confidence too low") and automatically generate a corrected diff.
-   **Flexibility**: Handles a variety of diff formats, allowing the LLM to choose the most appropriate one for the task at hand.

## Core Concepts

### Diff Strategies

The library is built around the concept of "strategies," each providing a different way to interpret and apply a diff.

1.  **`newUnifiedDiffStrategyService` (Recommended)**: The most advanced strategy. It doesn't rely on strict line numbers. Instead, it analyzes the content of the diff (context, additions, and removals) and searches for the best matching location in the source file. This is the most resilient and flexible option.
2.  **`multiSearchReplaceService`**: Ideal for targeted replacements. The LLM provides one or more `SEARCH` blocks and corresponding `REPLACE` blocks. The library finds the exact `SEARCH` content and replaces it. It can use line numbers as hints to narrow the search.
3.  **`unifiedDiffService`**: A wrapper around a traditional unified diff library. It requires a standard `diff -U` format with correct headers and line numbers. It is fast and efficient but brittle—it will fail if the source file has changed at all.

### Confidence Scoring

The `newUnifiedDiffStrategyService` calculates a `confidence` score (from 0.0 to 1.0) for every potential patch location. This score is based on multiple factors, including string similarity, context validation, and the uniqueness of the search content within the file. A patch is only applied if the confidence meets a configurable threshold (e.g., `0.95`), preventing incorrect applications.

### Detailed Error Feedback

A core design principle is providing feedback for failure. Instead of a generic "patch failed" message, the `DiffResult` object contains specific error details:

-   **Search Failure**: "Failed to find a matching location... (75% confidence, needs 95%)"
-   **Low Context**: "Possible Issues: Not enough context lines to uniquely identify the location."
-   **Fuzzy Match Failure**: "No sufficiently similar match found at line range 25-30..."
-   **Debug Info**: Includes the strategy used, similarity scores, and the content that was searched for, giving an agent all the information needed to try again.

## Installation

```bash
# Using npm
npm install diff-apply

# Using yarn
yarn add diff-apply

# Using bun
bun add diff-apply
```

## Usage

### Basic Example

Here’s a simple example of using the recommended **Advanced Unified Diff** strategy to apply a change.

```typescript
import { newUnifiedDiffStrategyService } from 'advanced-diff-patcher';
import * as fs from 'fs';

// 1. The original content of the file.
const originalContent = fs.readFileSync('src/utils.ts', 'utf-8');

// 2. The diff generated by an LLM. Note the '...' in the @@ line,
//    as this strategy doesn't need exact line numbers.
const llmGeneratedDiff = `--- src/utils.ts
+++ src/utils.ts
@@ ... @@
    function calculateTotal(items: number[]): number {
-      return items.reduce((sum, item) => {
-        return sum + item;
-      }, 0);
+      const total = items.reduce((sum, item) => {
+        return sum + item * 1.1;  // Add 10% markup
+      }, 0);
+      return Math.round(total * 100) / 100;  // Round to 2 decimal places
    }`;

// 3. Create an instance of the strategy with a desired confidence threshold.
const strategy = newUnifiedDiffStrategyService.create(0.95); // 95% confidence required

async function applyChange() {
  const result = await strategy.applyDiff({
    originalContent,
    diffContent: llmGeneratedDiff,
  });

  if (result.success) {
    fs.writeFileSync('src/utils.ts', result.content);
    console.log("Patch applied successfully!");
    console.log("New content:\n", result.content);
  } else {
    // The agent can use this detailed error to self-correct.
    console.error("Failed to apply patch:", result.error);
  }
}

applyChange();
```

### Choosing a Strategy

-   **Use `newUnifiedDiffStrategyService` for:** Most general-purpose coding tasks, refactoring, adding features, and fixing bugs. Its resilience makes it the best default choice.
-   **Use `multiSearchReplaceService` for:** Very precise, targeted changes where the exact content to be replaced is known. Good for simple variable renames or string literal changes across a file.
-   **Use `unifiedDiffService` for:** Systems where you can guarantee the diff is generated against the *exact* same version of the file that it will be applied to.

## LLM Integration and Prompting Guide

To integrate this library into an AI agent, provide the `getToolDescription()` output of one or more strategies in your system prompt. The LLM can then choose the appropriate format and generate a diff.

**System Prompt Example:**

> You are an expert AI programmer. When you need to modify a file, you must use the `apply_diff` tool. You must carefully read the format requirements for the diff and generate your response accordingly.

---

### Strategy 1: Advanced Unified Diff (`new-unified`)

This is the most powerful and recommended strategy. It focuses on the *content* of the change, not strict line numbers.

**Tool Description (for the LLM):**

```
# apply_diff Tool - Generate Precise Code Changes

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
```

**Example LLM Interaction:**

**User:**
> Refactor the `greet` function in `main.js` to say "Hello, Universe!" instead of "Hello, World!".

**LLM `apply_diff` call:**

```xml
<apply_diff>
<path>main.js</path>
<diff>
--- main.js
+++ main.js
@@ ... @@
 function greet() {
-  console.log("Hello, World!");
+  console.log("Hello, Universe!");
 }
</diff>
</apply_diff>
```

---

### Strategy 2: Multi-Search-Replace (`multi-search-replace`)

Use this for precise replacements.

**Tool Description (for the LLM):**

```
## apply_diff
Description: Request to replace existing code using search and replace blocks. This tool allows for precise, surgical replacements to files by specifying what content to search for and what to replace it with. It supports single or multiple replacements in one call. The SEARCH section must exactly match existing content including whitespace and indentation.

Parameters:
- path: (required) The path of the file to modify.
- diff: (required) The search/replace block(s) defining the changes.
- start_line: (optional) The line number where the search block starts.
- end_line: (optional) The line number where the search block ends.

Diff format:
<<<<<<< SEARCH
:start_line: (optional)
:end_line: (optional)
-------
[exact content to find including whitespace]
=======
[new content to replace with]
>>>>>>> REPLACE
... more blocks ...
```

**Example LLM Interaction:**

**User:**
> In `config.js`, change the `PORT` from `3000` to `8080` and the `HOST` from `"localhost"` to `"0.0.0.0"`.

**LLM `apply_diff` call:**

```xml
<apply_diff>
<path>config.js</path>
<diff>
<<<<<<< SEARCH
:start_line: 5
:end_line: 5
-------
const PORT = 3000;
=======
const PORT = 8080;
>>>>>>> REPLACE

<<<<<<< SEARCH
:start_line: 6
:end_line: 6
-------
const HOST = "localhost";
=======
const HOST = "0.0.0.0";
>>>>>>> REPLACE
</diff>
</apply_diff>
```

---

### Strategy 3: Standard Unified Diff (`unified`)

Use this only when diffs are generated against a guaranteed-to-be-identical file.

**Tool Description (for the LLM):**

```
## apply_diff
Description: Apply a unified diff to a file. This tool requires a strict unified diff format (diff -U3) with correct file headers and hunk headers (e.g., @@ -1,5 +1,6 @@).

Parameters:
- path: (required) The path of the file to apply the diff to.
- diff: (required) The diff content in strict unified format.

Format Requirements:
1. Header: Must include `--- path/to/file` and `+++ path/to/file`.
2. Hunks: Must include `@@ -start,count +start,count @@` with correct line numbers.
```

**Example LLM Interaction:**

**User:**
> I have a patch file to fix a bug in `calculator.js`. Please apply it.

**LLM `apply_diff` call:**

```xml
<apply_diff>
<path>src/calculator.js</path>
<diff>
--- src/calculator.js
+++ src/calculator.js
@@ -5,7 +5,7 @@
 function add(a, b) {
-  return a - b; // Bug here
+  return a + b;
 }
 
 export { add };
</diff>
</apply_diff>
```

---

### Handling Failures and Self-Correction

When an `applyDiff` call fails, the `error` message in the `DiffResult` is your feedback loop.

**Example Failure Scenario:**

1.  **LLM Task:** "In `app.js`, add logging to the `processRequest` function."
2.  **LLM generates a diff with too little context:**
    ```diff
    --- app.js
    +++ app.js
    @@ ... @@
    -   process(data);
    +   console.log('Processing request...');
    +   process(data);
    ```
3.  **Library returns a failure:**
    ```json
    {
      "success": false,
      "error": "Failed to find a matching location in the file (68% confidence, needs 95%)\n\nPossible Issues:\n- Not enough context lines to uniquely identify the location\n- Add a few more lines of unchanged code around your changes"
    }
    ```
4.  **Agent's next step:** The agent should feed this error back to the LLM.

    **Prompt to LLM:**
    > The previous attempt to modify `app.js` failed. The tool reported: "Failed to find a matching location... Not enough context lines...". Please read the file content for `app.js` again and generate a new diff with more surrounding context to ensure a unique match.

5.  **LLM generates a better diff:**
    ```diff
    --- app.js
    +++ app.js
    @@ ... @@
       if (!req.body) {
         return res.status(400).send('Bad Request');
       }
    -   process(req.body);
    +   console.log('Processing request...');
    +   process(req.body);
       res.status(200).send('OK');
     }
    ```
6.  This attempt succeeds because the additional context makes the location unambiguous.

## API Reference

-   **`DiffStrategy`**: The interface that all strategies implement.
    -   `getToolDescription(args)`: Returns a markdown string to be used in an LLM prompt.
    -   `applyDiff(params: ApplyDiffParams)`: Applies the diff.
-   **`ApplyDiffParams`**:
    -   `originalContent: string`: The source content of the file.
    -   `diffContent: string`: The diff content generated by the LLM.
    -   `startLine?: number`, `endLine?: number`: Optional line hints.
-   **`DiffResult`**:
    -   `success: true`, `content: string`: On success.
    -   `success: false`, `error: string`, `details?: object`: On failure.

## Contributing

Contributions are welcome! Please open an issue to discuss your ideas or submit a pull request. Ensure that all new features are accompanied by tests.

## License

This project is licensed under the MIT License.