const express = require('express');
const router = express.Router();
const { fetchPipelines, fetchOwners } = require('../services/hubspotClient');
const { withCache } = require('../utils/cache');

router.get('/pipelines', async (_req, res, next) => {
  try {
    const pipelines = await withCache('pipelines', 600, fetchPipelines);
    res.json(pipelines);
  } catch (err) { next(err); }
});

router.get('/owners', async (_req, res, next) => {
  try {
    const owners = await withCache('owners', 600, fetchOwners);
    res.json(owners);
  } catch (err) { next(err); }
});

module.exports = router;
