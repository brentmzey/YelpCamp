const {
  sendRequest,
  routes,
  methods,
  statusCodes,
} = require("../common/testHelpers");

describe("campgrounds routes", () => {
  it("allows a user to get all campgrounds without a search", async () => {
    const { body, statusCode } = await sendRequest(
      routes.campgrounds,
      methods.get
    );

    expect(statusCode).toBe(statusCodes.success);
    const matchingTiles = body.match(/thumbnail-image/g);
    expect(matchingTiles).toHaveLength(9);
  });
  it("allows a user to search campgrounds", async () => {
    const { body, statusCode } = await sendRequest(
      routes.campgrounds,
      methods.get,
      { query: { search: "newport" } }
    );

    expect(statusCode).toBe(statusCodes.success);
    const matchingTiles = body.match(/thumbnail-image/g);
    expect(matchingTiles).toHaveLength(1);
  });
  it("redirects on 404", async () => {
    const response = await sendRequest(
      `${routes.campgrounds}/does-not-exist`,
      methods.get
    );

    expect(response.statusCode).toBe(statusCodes.redirect);
  });
});
