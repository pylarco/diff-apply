I will split the provided test files into multiple, more granular test files and relocate them to the `test/unit` directory as requested.

First, I'll mark the original test files for deletion.

```typescript // src/strategies/__tests__/multi-search-replace.test.ts
//TODO: delete this file
```

```typescript // src/strategies/__tests__/new-unified.test.ts
//TODO: delete this file
```

```typescript // src/strategies/__tests__/search-replace.test.ts
//TODO: delete this file
```

```typescript // src/strategies/__tests__/unified.test.ts
//TODO: delete this file
```

Now, here are the new, split test files.

### New tests for `multi-search-replace`

```typescript // test/unit/strategies/multi-search-replace/apply-diff.test.ts
import { applyDiff } from "../../../../src/strategies/multi-search-replace.service";

describe("multiSearchReplaceService: applyDiff", () => {
  describe("exact matching", () => {
    it("should replace matching content", async () => {
      const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
      const diffContent = `test.ts
<<<<<<< SEARCH
function hello() {
    console.log("hello")
}
=======
function hello() {
    console.log("hello world")
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe('function hello() {\n    console.log("hello world")\n}\n')
      }
    })

    it("should match content with different surrounding whitespace", async () => {
      const originalContent = "\nfunction example() {\n    return 42;\n}\n\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
function example() {
    return 42;
}
=======
function example() {
    return 43;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("\nfunction example() {\n    return 43;\n}\n\n")
      }
    })

    it("should match content with different indentation in search block", async () => {
      const originalContent = "    function test() {\n        return true;\n    }\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
    return true;
}
=======
function test() {
    return false;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("    function test() {\n        return false;\n    }\n")
      }
    })

    it("should handle tab-based indentation", async () => {
      const originalContent = "function test() {\n\treturn true;\n}\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
\treturn true;
}
=======
function test() {
\treturn false;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("function test() {\n\treturn false;\n}\n")
      }
    })

    it("should preserve mixed tabs and spaces", async () => {
      const originalContent = "\tclass Example {\n\t    constructor() {\n\t\tthis.value = 0;\n\t    }\n\t}"
      const diffContent = `test.ts
<<<<<<< SEARCH
\tclass Example {
\t    constructor() {
\t\tthis.value = 0;
\t    }
\t}
=======
\tclass Example {
\t    constructor() {
\t\tthis.value = 1;
\t    }
\t}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          "\tclass Example {\n\t    constructor() {\n\t\tthis.value = 1;\n\t    }\n\t}",
        )
      }
    })

    it("should handle additional indentation with tabs", async () => {
      const originalContent = "\tfunction test() {\n\t\treturn true;\n\t}"
      const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
\treturn true;
}
=======
function test() {
\t// Add comment
\treturn false;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("\tfunction test() {\n\t\t// Add comment\n\t\treturn false;\n\t}")
      }
    })

    it("should preserve exact indentation characters when adding lines", async () => {
      const originalContent = "\tfunction test() {\n\t\treturn true;\n\t}"
      const diffContent = `test.ts
<<<<<<< SEARCH
\tfunction test() {
\t\treturn true;
\t}
=======
\tfunction test() {
\t\t// First comment
\t\t// Second comment
\t\treturn true;
\t}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          "\tfunction test() {\n\t\t// First comment\n\t\t// Second comment\n\t\treturn true;\n\t}",
        )
      }
    })

    it("should handle Windows-style CRLF line endings", async () => {
      const originalContent = "function test() {\r\n    return true;\r\n}\r\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
    return true;
}
=======
function test() {
    return false;
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("function test() {\r\n    return false;\r\n}\r\n")
      }
    })

    it("should return false if search content does not match", async () => {
      const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
      const diffContent = `test.ts
<<<<<<< SEARCH
function hello() {
    console.log("wrong")
}
=======
function hello() {
    console.log("hello world")
}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(false)
    })

    it("should return false if diff format is invalid", async () => {
      const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
      const diffContent = `test.ts\nInvalid diff format`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(false)
    })

    it("should handle multiple lines with proper indentation", async () => {
      const originalContent =
        "class Example {\n    constructor() {\n        this.value = 0\n    }\n\n    getValue() {\n        return this.value\n    }\n}\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
    getValue() {
        return this.value
    }
=======
    getValue() {
        // Add logging
        console.log("Getting value")
        return this.value
    }
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          'class Example {\n    constructor() {\n        this.value = 0\n    }\n\n    getValue() {\n        // Add logging\n        console.log("Getting value")\n        return this.value\n    }\n}\n',
        )
      }
    })

    it("should preserve whitespace exactly in the output", async () => {
      const originalContent = "    indented\n        more indented\n    back\n"
      const diffContent = `test.ts
<<<<<<< SEARCH
    indented
        more indented
    back
=======
    modified
        still indented
    end
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe("    modified\n        still indented\n    end\n")
      }
    })

    it("should preserve indentation when adding new lines after existing content", async () => {
      const originalContent = "				onScroll={() => updateHighlights()}"
      const diffContent = `test.ts
<<<<<<< SEARCH
				onScroll={() => updateHighlights()}
=======
				onScroll={() => updateHighlights()}
				onDragOver={(e) => {
					e.preventDefault()
					e.stopPropagation()
				}}
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          "				onScroll={() => updateHighlights()}\n				onDragOver={(e) => {\n					e.preventDefault()\n					e.stopPropagation()\n				}}",
        )
      }
    })

    it("should handle varying indentation levels correctly", async () => {
      const originalContent = `
class Example {
    constructor() {
        this.value = 0;
        if (true) {
            this.init();
        }
    }
}`.trim()

      const diffContent = `test.ts
<<<<<<< SEARCH
    class Example {
        constructor() {
            this.value = 0;
            if (true) {
                this.init();
            }
        }
    }
=======
    class Example {
        constructor() {
            this.value = 1;
            if (true) {
                this.init();
                this.setup();
                this.validate();
            }
        }
    }
>>>>>>> REPLACE`.trim()

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(
          `
class Example {
    constructor() {
        this.value = 1;
        if (true) {
            this.init();
            this.setup();
            this.validate();
        }
    }
}`.trim(),
        )
      }
    })

    it("should handle mixed indentation styles in the same file", async () => {
      const originalContent = `class Example {
    constructor() {
        this.value = 0;
        if (true) {
            this.init();
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
    constructor() {
        this.value = 0;
        if (true) {
        this.init();
        }
    }
=======
    constructor() {
        this.value = 1;
        if (true) {
        this.init();
        this.validate();
        }
    }
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Example {
    constructor() {
        this.value = 1;
        if (true) {
        this.init();
        this.validate();
        }
    }
}`)
      }
    })

    it("should handle Python-style significant whitespace", async () => {
      const originalContent = `def example():
    if condition:
        do_something()
        for item in items:
            process(item)
    return True`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
    if condition:
        do_something()
        for item in items:
            process(item)
=======
    if condition:
        do_something()
        while items:
            item = items.pop()
            process(item)
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`def example():
    if condition:
        do_something()
        while items:
            item = items.pop()
            process(item)
    return True`)
      }
    })

    it("should preserve empty lines with indentation", async () => {
      const originalContent = `function test() {
    const x = 1;

    if (x) {
        return true;
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
    const x = 1;

    if (x) {
=======
    const x = 1;

    // Check x
    if (x) {
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`function test() {
    const x = 1;

    // Check x
    if (x) {
        return true;
    }
}`)
      }
    })

    it("should handle indentation when replacing entire blocks", async () => {
      const originalContent = `class Test {
    method() {
        if (true) {
            console.log("test");
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
    method() {
        if (true) {
            console.log("test");
        }
    }
=======
    method() {
        try {
            if (true) {
                console.log("test");
            }
        } catch (e) {
            console.error(e);
        }
    }
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Test {
    method() {
        try {
            if (true) {
                console.log("test");
            }
        } catch (e) {
            console.error(e);
        }
    }
}`)
      }
    })

    it("should handle negative indentation relative to search content", async () => {
      const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
            this.setup();
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
            this.setup();
=======
        this.init();
        this.setup();
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
        this.init();
        this.setup();
        }
    }
}`)
      }
    })

    it("should handle extreme negative indentation (no indent)", async () => {
      const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
=======
this.init();
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
this.init();
        }
    }
}`)
      }
    })

    it("should handle mixed indentation changes in replace block", async () => {
      const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
            this.setup();
            this.validate();
        }
    }
}`.trim()
      const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
            this.setup();
            this.validate();
=======
        this.init();
            this.setup();
    this.validate();
>>>>>>> REPLACE`

      const result = await applyDiff(originalContent, diffContent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
        this.init();
            this.setup();
    this.validate();
        }
    }
}`)
      }
    })

    it("should find matches from middle out", async () => {
      const originalContent = `
function one() {
    return "target";
}

function two() {
    return "target";
}

function three() {
    return "target";
}

function four() {
    return "target";
}

function five() {
    return "target";
}`.trim()

      const diffContent = `test.ts
<<<<<<< SEARCH
    return "target";
=======
    return "updated";
>>>>>>> REPLACE`

      // Search around the middle (function three)
      // Even though all functions contain the target text,
      // it should match the one closest to line 9 first
      const result = await applyDiff(originalContent, diffContent, 0.9, 5, 9, 9)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.content).toBe(`function one() {
    return "target";
}

function two() {
    return "target";
}

function three() {
    return "updated";
}

function four() {
    return "target";
}

function five() {
    return "target";
}`)
      }
    })
  });
});
```

```typescript // test/unit/strategies/multi-search-replace/get-tool-description.test.ts
import { getToolDescription } from "../../../../src/strategies/multi-search-replace.service";

describe("multiSearchReplaceService: getToolDescription", () => {
  it("should include the current working directory", async () => {
    const cwd = "/test/dir"
    const description = await getToolDescription({ cwd })
    expect(description).toContain(`relative to the current working directory ${cwd}`)
  })

  it("should include required format elements", async () => {
    const description = await getToolDescription({ cwd: "/test" })
    expect(description).toContain("<<<<<<< SEARCH")
    expect(description).toContain("=======")
    expect(description).toContain(">>>>>>> REPLACE")
    expect(description).toContain("<apply_diff>")
    expect(description).toContain("</apply_diff>")
  })
})
```

### New tests for `new-unified`

```typescript // test/unit/strategies/new-unified/apply-diff.test.ts
import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: applyDiff", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should apply simple diff correctly", async () => {
    const original = `line1
line2
line3`

    const diff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
+new line
 line2
-line3
+modified line3`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`line1
new line
line2
modified line3`)
    }
  })

  it("should handle multiple hunks", async () => {
    const original = `line1
line2
line3
line4
line5`

    const diff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
+new line
 line2
-line3
+modified line3
@@ ... @@
 line4
-line5
+modified line5
+new line at end`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`line1
new line
line2
modified line3
line4
modified line5
new line at end`)
    }
  })

  it("should handle complex large", async () => {
    const original = `line1
line2
line3
line4
line5
line6
line7
line8
line9
line10`

    const diff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
+header line
+another header
 line2
-line3
-line4
+modified line3
+modified line4
+extra line
@@ ... @@
 line6
+middle section
 line7
-line8
+changed line8
+bonus line
@@ ... @@
 line9
-line10
+final line
+very last line`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`line1
header line
another header
line2
modified line3
modified line4
extra line
line5
line6
middle section
line7
changed line8
bonus line
line9
final line
very last line`)
    }
  })

  it("should handle indentation changes", async () => {
    const original = `first line
  indented line
    double indented line
  back to single indent
no indent
  indented again
    double indent again
      triple indent
  back to single
last line`

    const diff = `--- original
+++ modified
@@ ... @@
 first line
   indented line
+	tab indented line
+  new indented line
     double indented line
   back to single indent
 no indent
   indented again
     double indent again
-      triple indent
+      hi there mate
   back to single
 last line`

    const expected = `first line
  indented line
	tab indented line
  new indented line
    double indented line
  back to single indent
no indent
  indented again
    double indent again
      hi there mate
  back to single
last line`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should handle high level edits", async () => {
    const original = `def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)`
    const diff = `@@ ... @@
-def factorial(n):
-    if n == 0:
-        return 1
-    else:
-        return n * factorial(n-1)
+def factorial(number):
+    if number == 0:
+        return 1
+    else:
+        return number * factorial(number-1)`

    const expected = `def factorial(number):
    if number == 0:
        return 1
    else:
        return number * factorial(number-1)`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("it should handle very complex edits", async () => {
    const original = `//Initialize the array that will hold the primes
var primeArray = [];
/*Write a function that checks for primeness and
 pushes those values to t*he array*/
function PrimeCheck(candidate){
  isPrime = true;
  for(var i = 2; i < candidate && isPrime; i++){
    if(candidate%i === 0){
      isPrime = false;
    } else {
      isPrime = true;
    }
  }
  if(isPrime){
    primeArray.push(candidate);
  }
  return primeArray;
}
/*Write the code that runs the above until the
 l ength of the array equa*ls the number of primes
 desired*/

var numPrimes = prompt("How many primes?");

//Display the finished array of primes

//for loop starting at 2 as that is the lowest prime number keep going until the array is as long as we requested
for (var i = 2; primeArray.length < numPrimes; i++) {
  PrimeCheck(i); //
}
console.log(primeArray);
`

    const diff = `--- test_diff.js
+++ test_diff.js
@@ ... @@
-//Initialize the array that will hold the primes
 var primeArray = [];
-/*Write a function that checks for primeness and
- pushes those values to t*he array*/
 function PrimeCheck(candidate){
   isPrime = true;
   for(var i = 2; i < candidate && isPrime; i++){
@@ ... @@
   return primeArray;
 }
-/*Write the code that runs the above until the
-  l ength of the array equa*ls the number of primes
-  desired*/

 var numPrimes = prompt("How many primes?");

-//Display the finished array of primes
-
-//for loop starting at 2 as that is the lowest prime number keep going until the array is as long as we requested
 for (var i = 2; primeArray.length < numPrimes; i++) {
-  PrimeCheck(i); //
+  PrimeCheck(i);
 }
 console.log(primeArray);`

    const expected = `var primeArray = [];
function PrimeCheck(candidate){
  isPrime = true;
  for(var i = 2; i < candidate && isPrime; i++){
    if(candidate%i === 0){
      isPrime = false;
    } else {
      isPrime = true;
    }
  }
  if(isPrime){
    primeArray.push(candidate);
  }
  return primeArray;
}

var numPrimes = prompt("How many primes?");

for (var i = 2; primeArray.length < numPrimes; i++) {
  PrimeCheck(i);
}
console.log(primeArray);
`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })
})
```

```typescript // test/unit/strategies/new-unified/constructor.test.ts
import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: constructor", () => {
  it("should use default confidence threshold when not provided", () => {
    const defaultStrategy = create()
    expect(defaultStrategy.confidenceThreshold).toBe(1)
  })

  it("should use provided confidence threshold", () => {
    const customStrategy = create(0.85)
    expect(customStrategy.confidenceThreshold).toBe(0.85)
  })

  it("should enforce minimum confidence threshold", () => {
    const lowStrategy = create(0.7) // Below minimum of 0.8
    expect(lowStrategy.confidenceThreshold).toBe(0.8)
  })
})
```

```typescript // test/unit/strategies/new-unified/edge-cases.test.ts
import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: error handling and edge cases", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should reject completely invalid diff format", async () => {
    const original = "line1\nline2\nline3"
    const invalidDiff = "this is not a diff at all"

    const result = await strategy.applyDiff({ originalContent: original, diffContent: invalidDiff })
    expect(result.success).toBe(false)
  })

  it("should reject diff with invalid hunk format", async () => {
    const original = "line1\nline2\nline3"
    const invalidHunkDiff = `--- a/file.txt
+++ b/file.txt
invalid hunk header
 line1
-line2
+new line`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: invalidHunkDiff })
    expect(result.success).toBe(false)
  })

  it("should fail when diff tries to modify non-existent content", async () => {
    const original = "line1\nline2\nline3"
    const nonMatchingDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
-nonexistent line
+new line
 line3`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: nonMatchingDiff })
    expect(result.success).toBe(false)
  })

  it("should handle overlapping hunks", async () => {
    const original = `line1
line2
line3
line4
line5`
    const overlappingDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1
 line2
-line3
+modified3
 line4
@@ ... @@
 line2
-line3
-line4
+modified3and4
 line5`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: overlappingDiff })
    expect(result.success).toBe(false)
  })

  it("should handle empty lines modifications", async () => {
    const original = `line1

line3

line5`
    const emptyLinesDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1

-line3
+line3modified

 line5`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: emptyLinesDiff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`line1

line3modified

line5`)
    }
  })

  it("should handle mixed line endings in diff", async () => {
    const original = "line1\r\nline2\nline3\r\n"
    const mixedEndingsDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
 line1\r
-line2
+modified2\r
 line3`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: mixedEndingsDiff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("line1\r\nmodified2\r\nline3\r\n")
    }
  })

  it("should handle partial line modifications", async () => {
    const original = "const value = oldValue + 123;"
    const partialDiff = `--- a/file.txt
+++ b/file.txt
@@ ... @@
-const value = oldValue + 123;
+const value = newValue + 123;`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: partialDiff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("const value = newValue + 123;")
    }
  })

  it("should handle slightly malformed but recoverable diff", async () => {
    const original = "line1\nline2\nline3"
    // Missing space after --- and +++
    const slightlyBadDiff = `---a/file.txt
+++b/file.txt
@@ ... @@
 line1
-line2
+new line
 line3`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: slightlyBadDiff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("line1\nnew line\nline3")
    }
  })
})
```

```typescript // test/unit/strategies/new-unified/get-tool-description.test.ts
import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: getToolDescription", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should return tool description with correct cwd", () => {
    const cwd = "/test/path"
    const description = strategy.getToolDescription({ cwd })

    expect(description).toContain("apply_diff Tool - Generate Precise Code Changes")
    expect(description).toContain(cwd)
    expect(description).toContain("Step-by-Step Instructions")
    expect(description).toContain("Requirements")
    expect(description).toContain("Examples")
    expect(description).toContain("Parameters:")
  })
})
```

```typescript // test/unit/strategies/new-unified/hunk-splitting.test.ts
import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: hunk splitting", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should handle large diffs with multiple non-contiguous changes", async () => {
    const original = `import { readFile } from 'fs';
import { join } from 'path';
import { Logger } from './logger';

const logger = new Logger();

async function processFile(filePath: string) {
  try {
    const data = await readFile(filePath, 'utf8');
    logger.info('File read successfully');
    return data;
  } catch (error) {
    logger.error('Failed to read file:', error);
    throw error;
  }
}

function validateInput(input: string): boolean {
  if (!input) {
    logger.warn('Empty input received');
    return false;
  }
  return input.length > 0;
}

async function writeOutput(data: string) {
  logger.info('Processing output');
  // TODO: Implement output writing
  return Promise.resolve();
}

function parseConfig(configPath: string) {
  logger.debug('Reading config from:', configPath);
  // Basic config parsing
  return {
    enabled: true,
    maxRetries: 3
  };
}

export {
  processFile,
  validateInput,
  writeOutput,
  parseConfig
};`

    const diff = `--- a/file.ts
+++ b/file.ts
@@ ... @@
-import { readFile } from 'fs';
+import { readFile, writeFile } from 'fs';
 import { join } from 'path';
-import { Logger } from './logger';
+import { Logger } from './utils/logger';
+import { Config } from './types';

-const logger = new Logger();
+const logger = new Logger('FileProcessor');

 async function processFile(filePath: string) {
   try {
     const data = await readFile(filePath, 'utf8');
-    logger.info('File read successfully');
+    logger.info(\`File \${filePath} read successfully\`);
     return data;
   } catch (error) {
-    logger.error('Failed to read file:', error);
+    logger.error(\`Failed to read file \${filePath}:\`, error);
     throw error;
   }
 }

 function validateInput(input: string): boolean {
   if (!input) {
-    logger.warn('Empty input received');
+    logger.warn('Validation failed: Empty input received');
     return false;
   }
-  return input.length > 0;
+  return input.trim().length > 0;
 }

-async function writeOutput(data: string) {
-  logger.info('Processing output');
-  // TODO: Implement output writing
-  return Promise.resolve();
+async function writeOutput(data: string, outputPath: string) {
+  try {
+    await writeFile(outputPath, data, 'utf8');
+    logger.info(\`Output written to \${outputPath}\`);
+  } catch (error) {
+    logger.error(\`Failed to write output to \${outputPath}:\`, error);
+    throw error;
+  }
 }

-function parseConfig(configPath: string) {
-  logger.debug('Reading config from:', configPath);
-  // Basic config parsing
-  return {
-    enabled: true,
-    maxRetries: 3
-  };
+async function parseConfig(configPath: string): Promise<Config> {
+  try {
+    const configData = await readFile(configPath, 'utf8');
+    logger.debug(\`Reading config from \${configPath}\`);
+    return JSON.parse(configData);
+  } catch (error) {
+    logger.error(\`Failed to parse config from \${configPath}:\`, error);
+    throw error;
+  }
 }

 export {
   processFile,
   validateInput,
   writeOutput,
-  parseConfig
+  parseConfig,
+  type Config
 };`

    const expected = `import { readFile, writeFile } from 'fs';
import { join } from 'path';
import { Logger } from './utils/logger';
import { Config } from './types';

const logger = new Logger('FileProcessor');

async function processFile(filePath: string) {
  try {
    const data = await readFile(filePath, 'utf8');
    logger.info(\`File \${filePath} read successfully\`);
    return data;
  } catch (error) {
    logger.error(\`Failed to read file \${filePath}:\`, error);
    throw error;
  }
}

function validateInput(input: string): boolean {
  if (!input) {
    logger.warn('Validation failed: Empty input received');
    return false;
  }
  return input.trim().length > 0;
}

async function writeOutput(data: string, outputPath: string) {
  try {
    await writeFile(outputPath, data, 'utf8');
    logger.info(\`Output written to \${outputPath}\`);
  } catch (error) {
    logger.error(\`Failed to write output to \${outputPath}:\`, error);
    throw error;
  }
}

async function parseConfig(configPath: string): Promise<Config> {
  try {
    const configData = await readFile(configPath, 'utf8');
    logger.debug(\`Reading config from \${configPath}\`);
    return JSON.parse(configData);
  } catch (error) {
    logger.error(\`Failed to parse config from \${configPath}:\`, error);
    throw error;
  }
}

export {
  processFile,
  validateInput,
  writeOutput,
  parseConfig,
  type Config
};`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })
})
```

```typescript // test/unit/strategies/new-unified/similar-code.test.ts
import { create } from "../../../../src/strategies/new-unified"

describe("new-unified: similar code sections", () => {
  let strategy: ReturnType<typeof create>

  beforeEach(() => {
    strategy = create(0.97)
  })

  it("should correctly modify the right section when similar code exists", async () => {
    const original = `function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a + b;  // Bug here
}`

    const diff = `--- a/math.js
+++ b/math.js
@@ ... @@
 function multiply(a, b) {
-  return a + b;  // Bug here
+  return a * b;
 }`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}`)
    }
  })

  it("should handle multiple similar sections with correct context", async () => {
    const original = `if (condition) {
  doSomething();
  doSomething();
  doSomething();
}

if (otherCondition) {
  doSomething();
  doSomething();
  doSomething();
}`

    const diff = `--- a/file.js
+++ b/file.js
@@ ... @@
 if (otherCondition) {
   doSomething();
-  doSomething();
+  doSomethingElse();
   doSomething();
 }`

    const result = await strategy.applyDiff({ originalContent: original, diffContent: diff })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`if (condition) {
  doSomething();
  doSomething();
  doSomething();
}

if (otherCondition) {
  doSomething();
  doSomethingElse();
  doSomething();
}`)
    }
  })
})
```

### New tests for `search-replace`

```typescript // test/unit/strategies/search-replace/deletion.test.ts
import { searchReplaceService } from "../../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: deletion", () => {
  it("should delete code when replace block is empty", async () => {
    const originalContent = `function test() {
    console.log("hello");
    // Comment to remove
    console.log("world");
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
    // Comment to remove
=======
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    console.log("hello");
    console.log("world");
}`)
    }
  })

  it("should delete multiple lines when replace block is empty", async () => {
    const originalContent = `class Example {
    constructor() {
        // Initialize
        this.value = 0;
        // Set defaults
        this.name = "";
        // End init
    }
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
        // Initialize
        this.value = 0;
        // Set defaults
        this.name = "";
        // End init
=======
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
    }
}`)
    }
  })

  it("should preserve indentation when deleting nested code", async () => {
    const originalContent = `function outer() {
    if (true) {
        // Remove this
        console.log("test");
        // And this
    }
    return true;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
        // Remove this
        console.log("test");
        // And this
=======
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function outer() {
    if (true) {
    }
    return true;
}`)
    }
  })
})
```

```typescript // test/unit/strategies/search-replace/exact-matching.test.ts
import { searchReplaceService } from "../../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: exact matching", () => {
  it("should replace matching content", async () => {
    const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
    const diffContent = `test.ts
<<<<<<< SEARCH
function hello() {
    console.log("hello")
}
=======
function hello() {
    console.log("hello world")
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe('function hello() {\n    console.log("hello world")\n}\n')
    }
  })

  it("should match content with different surrounding whitespace", async () => {
    const originalContent = "\nfunction example() {\n    return 42;\n}\n\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function example() {
    return 42;
}
=======
function example() {
    return 43;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("\nfunction example() {\n    return 43;\n}\n\n")
    }
  })

  it("should match content with different indentation in search block", async () => {
    const originalContent = "    function test() {\n        return true;\n    }\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
    return true;
}
=======
function test() {
    return false;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("    function test() {\n        return false;\n    }\n")
    }
  })

  it("should handle tab-based indentation", async () => {
    const originalContent = "function test() {\n\treturn true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
\treturn true;
}
=======
function test() {
\treturn false;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\n\treturn false;\n}\n")
    }
  })

  it("should preserve mixed tabs and spaces", async () => {
    const originalContent = "\tclass Example {\n\t    constructor() {\n\t\tthis.value = 0;\n\t    }\n\t}"
    const diffContent = `test.ts
<<<<<<< SEARCH
\tclass Example {
\t    constructor() {
\t\tthis.value = 0;
\t    }
\t}
=======
\tclass Example {
\t    constructor() {
\t\tthis.value = 1;
\t    }
\t}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        "\tclass Example {\n\t    constructor() {\n\t\tthis.value = 1;\n\t    }\n\t}",
      )
    }
  })

  it("should handle additional indentation with tabs", async () => {
    const originalContent = "\tfunction test() {\n\t\treturn true;\n\t}"
    const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
\treturn true;
}
=======
function test() {
\t// Add comment
\treturn false;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("\tfunction test() {\n\t\t// Add comment\n\t\treturn false;\n\t}")
    }
  })

  it("should preserve exact indentation characters when adding lines", async () => {
    const originalContent = "\tfunction test() {\n\t\treturn true;\n\t}"
    const diffContent = `test.ts
<<<<<<< SEARCH
\tfunction test() {
\t\treturn true;
\t}
=======
\tfunction test() {
\t\t// First comment
\t\t// Second comment
\t\treturn true;
\t}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        "\tfunction test() {\n\t\t// First comment\n\t\t// Second comment\n\t\treturn true;\n\t}",
      )
    }
  })

  it("should handle Windows-style CRLF line endings", async () => {
    const originalContent = "function test() {\r\n    return true;\r\n}\r\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function test() {
    return true;
}
=======
function test() {
    return false;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\r\n    return false;\r\n}\r\n")
    }
  })

  it("should return false if search content does not match", async () => {
    const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
    const diffContent = `test.ts
<<<<<<< SEARCH
function hello() {
    console.log("wrong")
}
=======
function hello() {
    console.log("hello world")
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })

  it("should return false if diff format is invalid", async () => {
    const originalContent = 'function hello() {\n    console.log("hello")\n}\n'
    const diffContent = `test.ts\nInvalid diff format`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })

  it("should handle multiple lines with proper indentation", async () => {
    const originalContent =
      "class Example {\n    constructor() {\n        this.value = 0\n    }\n\n    getValue() {\n        return this.value\n    }\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
    getValue() {
        return this.value
    }
=======
    getValue() {
        // Add logging
        console.log("Getting value")
        return this.value
    }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        'class Example {\n    constructor() {\n        this.value = 0\n    }\n\n    getValue() {\n        // Add logging\n        console.log("Getting value")\n        return this.value\n    }\n}\n',
      )
    }
  })

  it("should preserve whitespace exactly in the output", async () => {
    const originalContent = "    indented\n        more indented\n    back\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
    indented
        more indented
    back
=======
    modified
        still indented
    end
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("    modified\n        still indented\n    end\n")
    }
  })

  it("should preserve indentation when adding new lines after existing content", async () => {
    const originalContent = "				onScroll={() => updateHighlights()}"
    const diffContent = `test.ts
<<<<<<< SEARCH
				onScroll={() => updateHighlights()}
=======
				onScroll={() => updateHighlights()}
				onDragOver={(e) => {
					e.preventDefault()
					e.stopPropagation()
				}}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        "				onScroll={() => updateHighlights()}\n				onDragOver={(e) => {\n					e.preventDefault()\n					e.stopPropagation()\n				}}",
      )
    }
  })

  it("should handle varying indentation levels correctly", async () => {
    const originalContent = `
class Example {
    constructor() {
        this.value = 0;
        if (true) {
            this.init();
        }
    }
}`.trim()

    const diffContent = `test.ts
<<<<<<< SEARCH
    class Example {
        constructor() {
            this.value = 0;
            if (true) {
                this.init();
            }
        }
    }
=======
    class Example {
        constructor() {
            this.value = 1;
            if (true) {
                this.init();
                this.setup();
                this.validate();
            }
        }
    }
>>>>>>> REPLACE`.trim()

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        `
class Example {
    constructor() {
        this.value = 1;
        if (true) {
            this.init();
            this.setup();
            this.validate();
        }
    }
}`.trim(),
      )
    }
  })

  it("should handle mixed indentation styles in the same file", async () => {
    const originalContent = `class Example {
    constructor() {
        this.value = 0;
        if (true) {
            this.init();
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
    constructor() {
        this.value = 0;
        if (true) {
        this.init();
        }
    }
=======
    constructor() {
        this.value = 1;
        if (true) {
        this.init();
        this.validate();
        }
    }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
        this.value = 1;
        if (true) {
        this.init();
        this.validate();
        }
    }
}`)
    }
  })

  it("should handle Python-style significant whitespace", async () => {
    const originalContent = `def example():
    if condition:
        do_something()
        for item in items:
            process(item)
    return True`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
    if condition:
        do_something()
        for item in items:
            process(item)
=======
    if condition:
        do_something()
        while items:
            item = items.pop()
            process(item)
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`def example():
    if condition:
        do_something()
        while items:
            item = items.pop()
            process(item)
    return True`)
    }
  })

  it("should preserve empty lines with indentation", async () => {
    const originalContent = `function test() {
    const x = 1;

    if (x) {
        return true;
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
    const x = 1;

    if (x) {
=======
    const x = 1;

    // Check x
    if (x) {
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    const x = 1;

    // Check x
    if (x) {
        return true;
    }
}`)
    }
  })

  it("should handle indentation when replacing entire blocks", async () => {
    const originalContent = `class Test {
    method() {
        if (true) {
            console.log("test");
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
    method() {
        if (true) {
            console.log("test");
        }
    }
=======
    method() {
        try {
            if (true) {
                console.log("test");
            }
        } catch (e) {
            console.error(e);
        }
    }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Test {
    method() {
        try {
            if (true) {
                console.log("test");
            }
        } catch (e) {
            console.error(e);
        }
    }
}`)
    }
  })

  it("should handle negative indentation relative to search content", async () => {
    const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
            this.setup();
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
            this.setup();
=======
        this.init();
        this.setup();
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
        this.init();
        this.setup();
        }
    }
}`)
    }
  })

  it("should handle extreme negative indentation (no indent)", async () => {
    const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
=======
this.init();
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
this.init();
        }
    }
}`)
    }
  })

  it("should handle mixed indentation changes in replace block", async () => {
    const originalContent = `class Example {
    constructor() {
        if (true) {
            this.init();
            this.setup();
            this.validate();
        }
    }
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
            this.init();
            this.setup();
            this.validate();
=======
        this.init();
            this.setup();
    this.validate();
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`class Example {
    constructor() {
        if (true) {
        this.init();
            this.setup();
    this.validate();
        }
    }
}`)
    }
  })

  it("should find matches from middle out", async () => {
    const originalContent = `
function one() {
    return "target";
}

function two() {
    return "target";
}

function three() {
    return "target";
}

function four() {
    return "target";
}

function five() {
    return "target";
}`.trim()

    const diffContent = `test.ts
<<<<<<< SEARCH
    return "target";
=======
    return "updated";
>>>>>>> REPLACE`

    // Search around the middle (function three)
    // Even though all functions contain the target text,
    // it should match the one closest to line 9 first
    const result = applyDiff({ originalContent, diffContent, startLine: 9, endLine: 9 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return "target";
}

function two() {
    return "target";
}

function three() {
    return "updated";
}

function four() {
    return "target";
}

function five() {
    return "target";
}`)
    }
  })
})
```

```typescript // test/unit/strategies/search-replace/fuzzy-matching.test.ts
import { searchReplaceService } from "../../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: fuzzy matching", () => {
  it("should match content with small differences (>90% similar)", async () => {
    const originalContent =
      "function getData() {\n    const results = fetchData();\n    return results.filter(Boolean);\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function getData() {
    const result = fetchData();
    return results.filter(Boolean);
}
=======
function getData() {
    const data = fetchData();
    return data.filter(Boolean);
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(
        "function getData() {\n    const data = fetchData();\n    return data.filter(Boolean);\n}\n",
      )
    }
  })

  it("should not match when content is too different (<90% similar)", async () => {
    const originalContent = "function processUsers(data) {\n    return data.map(user => user.name);\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
function handleItems(items) {
    return items.map(item => item.username);
}
=======
function processData(data) {
    return data.map(d => d.value);
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })

  it("should match content with extra whitespace", async () => {
    const originalContent = "function sum(a, b) {\n    return a + b;\n}"
    const diffContent = `test.ts
<<<<<<< SEARCH
function   sum(a,   b)    {
    return    a + b;
}
=======
function sum(a, b) {
    return a + b + 1;
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function sum(a, b) {\n    return a + b + 1;\n}")
    }
  })

  it("should not exact match empty lines", async () => {
    const originalContent = "function sum(a, b) {\n\n    return a + b;\n}"
    const diffContent = `test.ts
<<<<<<< SEARCH
function sum(a, b) {
=======
import { a } from "a";
function sum(a, b) {
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe('import { a } from "a";\nfunction sum(a, b) {\n\n    return a + b;\n}')
    }
  })
})
```

```typescript // test/unit/strategies/search-replace/get-tool-description.test.ts
import { searchReplaceService } from "../../../../../dist"

const { getToolDescription } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: getToolDescription", () => {
  it("should include the current working directory", async () => {
    const cwd = "/test/dir"
    const description = getToolDescription({ cwd })
    expect(description).toContain(`relative to the current working directory ${cwd}`)
  })

  it("should include required format elements", async () => {
    const description = getToolDescription({ cwd: "/test" })
    expect(description).toContain("<<<<<<< SEARCH")
    expect(description).toContain("=======")
    expect(description).toContain(">>>>>>> REPLACE")
    expect(description).toContain("<apply_diff>")
    expect(description).toContain("</apply_diff>")
  })

  it("should document start_line and end_line parameters", async () => {
    const description = getToolDescription({ cwd: "/test" })
    expect(description).toContain("start_line: (required) The line number where the search block starts.")
    expect(description).toContain("end_line: (required) The line number where the search block ends.")
  })
})
```

```typescript // test/unit/strategies/search-replace/insertion.test.ts
import { searchReplaceService } from "../../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: insertion", () => {
  it("should insert code at specified line when search block is empty", async () => {
    const originalContent = `function test() {
    const x = 1;
    return x;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======
    console.log("Adding log");
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 2, endLine: 2 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    console.log("Adding log");
    const x = 1;
    return x;
}`)
    }
  })

  it("should preserve indentation when inserting at nested location", async () => {
    const originalContent = `function test() {
    if (true) {
        const x = 1;
    }
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======
        console.log("Before");
        console.log("After");
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 3, endLine: 3 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    if (true) {
        console.log("Before");
        console.log("After");
        const x = 1;
    }
}`)
    }
  })

  it("should handle insertion at start of file", async () => {
    const originalContent = `function test() {
    return true;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======
// Copyright 2024
// License: MIT

>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 1, endLine: 1 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`// Copyright 2024
// License: MIT

function test() {
    return true;
}`)
    }
  })

  it("should handle insertion at end of file", async () => {
    const originalContent = `function test() {
    return true;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======

// End of file
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 4, endLine: 4 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function test() {
    return true;
}

// End of file`)
    }
  })

  it("should error if no start_line is provided for insertion", async () => {
    const originalContent = `function test() {
    return true;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
=======
console.log("test");
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })
})
```

```typescript // test/unit/strategies/search-replace/line-constrained-search.test.ts
import { searchReplaceService } from "../../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: line-constrained search", () => {
  it("should find and replace within specified line range", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function two() {
    return 2;
}
=======
function two() {
    return "two";
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 5, endLine: 7, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function two() {
    return "two";
}

function three() {
    return 3;
}`)
    }
  })

  it("should find and replace within buffer zone (5 lines before/after)", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function three() {
    return 3;
}
=======
function three() {
    return "three";
}
>>>>>>> REPLACE`

    // Even though we specify lines 5-7, it should still find the match at lines 9-11
    // because it's within the 5-line buffer zone
    const result = applyDiff({ originalContent, diffContent, startLine: 5, endLine: 7, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return "three";
}`)
    }
  })

  it("should not find matches outside search range and buffer zone", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}

function four() {
    return 4;
}

function five() {
    return 5;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function five() {
    return 5;
}
=======
function five() {
    return "five";
}
>>>>>>> REPLACE`

    // Searching around function two() (lines 5-7)
    // function five() is more than 5 lines away, so it shouldn't match
    const result = applyDiff({ originalContent, diffContent, startLine: 5, endLine: 7, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(false)
  })

  it("should handle search range at start of file", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function one() {
    return 1;
}
=======
function one() {
    return "one";
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 1, endLine: 3, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return "one";
}

function two() {
    return 2;
}`)
    }
  })

  it("should handle search range at end of file", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function two() {
    return 2;
}
=======
function two() {
    return "two";
}
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent, startLine: 5, endLine: 7, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function two() {
    return "two";
}`)
    }
  })

  it("should match specific instance of duplicate code using line numbers", async () => {
    const originalContent = `
function processData(data) {
    return data.map(x => x * 2);
}

function unrelatedStuff() {
    console.log("hello");
}

// Another data processor
function processData(data) {
    return data.map(x => x * 2);
}

function moreStuff() {
    console.log("world");
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function processData(data) {
    return data.map(x => x * 2);
}
=======
function processData(data) {
    // Add logging
    console.log("Processing data...");
    return data.map(x => x * 2);
}
>>>>>>> REPLACE`

    // Target the second instance of processData
    const result = applyDiff({ originalContent, diffContent, startLine: 10, endLine: 12, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function processData(data) {
    return data.map(x => x * 2);
}

function unrelatedStuff() {
    console.log("hello");
}

// Another data processor
function processData(data) {
    // Add logging
    console.log("Processing data...");
    return data.map(x => x * 2);
}

function moreStuff() {
    console.log("world");
}`)
    }
  })

  it("should search from start line to end of file when only start_line is provided", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function three() {
    return 3;
}
=======
function three() {
    return "three";
}
>>>>>>> REPLACE`

    // Only provide start_line, should search from there to end of file
    const result = applyDiff({ originalContent, diffContent, startLine: 8, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return "three";
}`)
    }
  })

  it("should search from start of file to end line when only end_line is provided", async () => {
    const originalContent = `
function one() {
    return 1;
}

function two() {
    return 2;
}

function three() {
    return 3;
}
`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function one() {
    return 1;
}
=======
function one() {
    return "one";
}
>>>>>>> REPLACE`

    // Only provide end_line, should search from start of file to there
    const result = applyDiff({ originalContent, diffContent, endLine: 4, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return "one";
}

function two() {
    return 2;
}

function three() {
    return 3;
}`)
    }
  })

  it("should prioritize exact line match over expanded search", async () => {
    const originalContent = `
function one() {
    return 1;
}

function process() {
    return "old";
}

function process() {
    return "old";
}

function two() {
    return 2;
}`
    const diffContent = `test.ts
<<<<<<< SEARCH
function process() {
    return "old";
}
=======
function process() {
    return "new";
}
>>>>>>> REPLACE`

    // Should match the second instance exactly at lines 10-12
    // even though the first instance at 6-8 is within the expanded search range
    const result = applyDiff({ originalContent, diffContent, startLine: 10, endLine: 12, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`
function one() {
    return 1;
}

function process() {
    return "old";
}

function process() {
    return "new";
}

function two() {
    return 2;
}`)
    }
  })

  it("should fall back to expanded search only if exact match fails", async () => {
    const originalContent = `
function one() {
    return 1;
}

function process() {
    return "target";
}

function two() {
    return 2;
}`.trim()
    const diffContent = `test.ts
<<<<<<< SEARCH
function process() {
    return "target";
}
=======
function process() {
    return "updated";
}
>>>>>>> REPLACE`

    // Specify wrong line numbers (3-5), but content exists at 6-8
    // Should still find and replace it since it's within the expanded range
    const result = applyDiff({ originalContent, diffContent, startLine: 3, endLine: 5, fuzzyThreshold: 0.9, bufferLines: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(`function one() {
    return 1;
}

function process() {
    return "updated";
}

function two() {
    return 2;
}`)
    }
  })
})
```

```typescript // test/unit/strategies/search-replace/line-number-stripping.test.ts
import { searchReplaceService } from "../../../../../dist"

const { applyDiff } = searchReplaceService.searchReplaceService

describe("SearchReplaceDiffStrategy: line number stripping", () => {
  it("should strip line numbers from both search and replace sections", async () => {
    const originalContent = "function test() {\n    return true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
1 | function test() {
2 |     return true;
3 | }
=======
1 | function test() {
2 |     return false;
3 | }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\n    return false;\n}\n")
    }
  })

  it("should strip line numbers with leading spaces", async () => {
    const originalContent = "function test() {\n    return true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
 1 | function test() {
 2 |     return true;
 3 | }
=======
 1 | function test() {
 2 |     return false;
 3 | }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\n    return false;\n}\n")
    }
  })

  it("should not strip when not all lines have numbers in either section", async () => {
    const originalContent = "function test() {\n    return true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
1 | function test() {
2 |     return true;
3 | }
=======
1 | function test() {
    return false;
3 | }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(false)
  })

  it("should preserve content that naturally starts with pipe", async () => {
    const originalContent = "|header|another|\n|---|---|\n|data|more|\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
1 | |header|another|
2 | |---|---|
3 | |data|more|
=======
1 | |header|another|
2 | |---|---|
3 | |data|updated|
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("|header|another|\n|---|---|\n|data|updated|\n")
    }
  })

  it("should preserve indentation when stripping line numbers", async () => {
    const originalContent = "    function test() {\n        return true;\n    }\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
1 |     function test() {
2 |         return true;
3 |     }
=======
1 |     function test() {
2 |         return false;
3 |     }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("    function test() {\n        return false;\n    }\n")
    }
  })

  it("should handle different line numbers between sections", async () => {
    const originalContent = "function test() {\n    return true;\n}\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
10 | function test() {
11 |     return true;
12 | }
=======
20 | function test() {
21 |     return false;
22 | }
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("function test() {\n    return false;\n}\n")
    }
  })

  it("should not strip content that starts with pipe but no line number", async () => {
    const originalContent = "| Pipe\n|---|\n| Data\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
| Pipe
|---|
| Data
=======
| Pipe
|---|
| Updated
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("| Pipe\n|---|\n| Updated\n")
    }
  })

  it("should handle mix of line-numbered and pipe-only content", async () => {
    const originalContent = "| Pipe\n|---|\n| Data\n"
    const diffContent = `test.ts
<<<<<<< SEARCH
| Pipe
|---|
| Data
=======
1 | | Pipe
2 | |---|
3 | | NewData
>>>>>>> REPLACE`

    const result = applyDiff({ originalContent, diffContent })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe("1 | | Pipe\n2 | |---|\n3 | | NewData\n")
    }
  })
})
```

### New tests for `unified`

```typescript // test/unit/strategies/unified/apply-diff.test.ts
import { applyDiff } from "../../../../src/strategies/unified.service"

describe("UnifiedDiffStrategy: applyDiff", () => {
  it("should successfully apply a function modification diff", async () => {
    const originalContent = `import { Logger } from '../logger';

function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => {
    return sum + item;
  }, 0);
}

export { calculateTotal };`

    const diffContent = `--- src/utils/helper.ts
+++ src/utils/helper.ts
@@ -1,9 +1,10 @@
 import { Logger } from '../logger';

 function calculateTotal(items: number[]): number {
-  return items.reduce((sum, item) => {
-    return sum + item;
+  const total = items.reduce((sum, item) => {
+    return sum + item * 1.1;  // Add 10% markup
   }, 0);
+  return Math.round(total * 100) / 100;  // Round to 2 decimal places
 }

 export { calculateTotal };`

    const expected = `import { Logger } from '../logger';

function calculateTotal(items: number[]): number {
  const total = items.reduce((sum, item) => {
    return sum + item * 1.1;  // Add 10% markup
  }, 0);
  return Math.round(total * 100) / 100;  // Round to 2 decimal places
}

export { calculateTotal };`

    const result = await applyDiff(originalContent, diffContent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should successfully apply a diff adding a new method", async () => {
    const originalContent = `class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}`

    const diffContent = `--- src/Calculator.ts
+++ src/Calculator.ts
@@ -1,5 +1,9 @@
 class Calculator {
   add(a: number, b: number): number {
     return a + b;
   }
+
+  multiply(a: number, b: number): number {
+    return a * b;
+  }
 }`

    const expected = `class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }
}`

    const result = await applyDiff(originalContent, diffContent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should successfully apply a diff modifying imports", async () => {
    const originalContent = `import { useState } from 'react';
import { Button } from './components';

function App() {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount(count + 1)}>{count}</Button>;
}`

    const diffContent = `--- src/App.tsx
+++ src/App.tsx
@@ -1,7 +1,8 @@
-import { useState } from 'react';
+import { useState, useEffect } from 'react';
 import { Button } from './components';

 function App() {
   const [count, setCount] = useState(0);
+  useEffect(() => { document.title = \`Count: \${count}\` }, [count]);
   return <Button onClick={() => setCount(count + 1)}>{count}</Button>;
 }`

    const expected = `import { useState, useEffect } from 'react';
import { Button } from './components';

function App() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = \`Count: \${count}\` }, [count]);
  return <Button onClick={() => setCount(count + 1)}>{count}</Button>;
}`

    const result = await applyDiff(originalContent, diffContent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should successfully apply a diff with multiple hunks", async () => {
    const originalContent = `import { readFile, writeFile } from 'fs';

function processFile(path: string) {
  readFile(path, 'utf8', (err, data) => {
    if (err) throw err;
    const processed = data.toUpperCase();
    writeFile(path, processed, (err) => {
      if (err) throw err;
    });
  });
}

export { processFile };`

    const diffContent = `--- src/file-processor.ts
+++ src/file-processor.ts
@@ -1,12 +1,14 @@
-import { readFile, writeFile } from 'fs';
+import { promises as fs } from 'fs';
+import { join } from 'path';

-function processFile(path: string) {
-  readFile(path, 'utf8', (err, data) => {
-    if (err) throw err;
+async function processFile(path: string) {
+  try {
+    const data = await fs.readFile(join(__dirname, path), 'utf8');
     const processed = data.toUpperCase();
-    writeFile(path, processed, (err) => {
-      if (err) throw err;
-    });
-  });
+    await fs.writeFile(join(__dirname, path), processed);
+  } catch (error) {
+    console.error('Failed to process file:', error);
+    throw error;
+  }
 }

 export { processFile };`

    const expected = `import { promises as fs } from 'fs';
import { join } from 'path';

async function processFile(path: string) {
  try {
    const data = await fs.readFile(join(__dirname, path), 'utf8');
    const processed = data.toUpperCase();
    await fs.writeFile(join(__dirname, path), processed);
  } catch (error) {
    console.error('Failed to process file:', error);
    throw error;
  }
}

export { processFile };`

    const result = await applyDiff(originalContent, diffContent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })

  it("should handle empty original content", async () => {
    const originalContent = ""
    const diffContent = `--- empty.ts
+++ empty.ts
@@ -0,0 +1,3 @@
+export function greet(name: string): string {
+  return \`Hello, \${name}!\`;
+}`

    const expected = `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}\n`

    const result = await applyDiff(originalContent, diffContent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe(expected)
    }
  })
})
```

```typescript // test/unit/strategies/unified/get-tool-description.test.ts
import { getToolDescription } from "../../../../src/strategies/unified.service"

describe("UnifiedDiffStrategy: getToolDescription", () => {
  it("should return tool description with correct cwd", () => {
    const cwd = "/test/path"
    const description = getToolDescription({ cwd })

    expect(description).toContain("apply_diff")
    expect(description).toContain(cwd)
    expect(description).toContain("Parameters:")
    expect(description).toContain("Format Requirements:")
  })
})
```