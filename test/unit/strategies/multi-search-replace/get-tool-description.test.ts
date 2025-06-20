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