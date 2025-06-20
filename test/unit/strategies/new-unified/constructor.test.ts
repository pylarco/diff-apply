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