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