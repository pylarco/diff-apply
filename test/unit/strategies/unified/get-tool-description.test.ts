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