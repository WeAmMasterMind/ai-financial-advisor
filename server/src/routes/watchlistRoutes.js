const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const watchlistController = require('../controllers/watchlistController');

router.use(protect);

router.get('/', watchlistController.getWatchlist);
router.post('/', watchlistController.addToWatchlist);
router.delete('/:symbol', watchlistController.removeFromWatchlist);
router.patch('/:symbol', watchlistController.updateWatchlistItem);

module.exports = router;