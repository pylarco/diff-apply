import { getToolDescription } from "../../../../src/strategies/multi-search-replace.service"

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
    expect(description).toContain(":start_line: (required) The line number of original content where the search block starts.")
    expect(description).toContain(":end_line: (required) The line number of original content where the search block ends.")
  })
})