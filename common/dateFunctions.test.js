const { toStringFromTimestamp } = require("./dateFunctions");

describe("date function", () => {
  describe("toStringFromTimestamp", () => {
    it("converts todays timestamp to the correct date", () => {
      expect(toStringFromTimestamp(Date.now())).toBe("8/8/2020");
    });
  });
});
