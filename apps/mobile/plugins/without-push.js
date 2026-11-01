// Xe Key only schedules local notifications (engine auto-off reminder); Honda pushes go to the
// official app's token. A free Apple account can't sign the push capability, so drop it.
const { withEntitlementsPlist } = require("expo/config-plugins");

module.exports = function withoutPush(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults["aps-environment"];
    return c;
  });
};
