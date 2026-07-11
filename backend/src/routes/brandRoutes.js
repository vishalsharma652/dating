const router = require('express').Router();
const brand = require('../controllers/brandController');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', asyncHandler(brand.getBrand));

module.exports = router;
