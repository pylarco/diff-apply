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