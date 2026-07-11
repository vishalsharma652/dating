const settingsModel = require('../models/settingsModel');
const { ok } = require('../utils/apiResponse');

async function getBrand(req, res) {
  return ok(res, { brand: await settingsModel.brand() });
}

module.exports = { getBrand };
