const got = require("got");
const localHostServer = "http://localhost:1000";

module.exports.sendRequest = async (route, method, { query, user } = {}) => {
  if (user) {
    throw new Error("Implement the ability to test authenticated actions");
  }
  const searchParams = query ? { ...query } : {};

  const res = await got(route, {
    prefixUrl: localHostServer,
    method,
    searchParams,
    followRedirect: false,
  });

  return { statusCode: res.statusCode, body: res.body };
};

module.exports.routes = { campgrounds: "campgrounds", comments: "comments" };
module.exports.methods = { get: "GET", post: "POST" };
module.exports.statusCodes = { success: 200, redirect: 302 };
