const moment = require("moment");

module.exports.toStringFromTimestamp = (
  unixMillisecondTimestamp,
  { customFormat = "MM-DD-YYYY" } = {}
) => {
  return moment(unixMillisecondTimestamp).format(customFormat);
};
