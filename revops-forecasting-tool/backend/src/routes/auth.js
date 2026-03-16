const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

/**
 * HubSpot OAuth 2.0 flow endpoints.
 * Used when this tool is deployed as a HubSpot Connected App
 * (as opposed to using a Private App token).
 */

const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';

/** GET /auth/install  – redirect user to HubSpot OAuth consent screen */
router.get('/install', (_req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.HUBSPOT_CLIENT_ID || '',
    redirect_uri: process.env.HUBSPOT_REDIRECT_URI || '',
    scope: 'crm.objects.deals.read crm.objects.owners.read crm.pipelines.read',
  });
  res.redirect(`${HUBSPOT_AUTH_URL}?${params.toString()}`);
});

/** GET /auth/callback  – exchange code for tokens */
router.get('/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing authorization code' });

    const axios = require('axios');
    const response = await axios.post(HUBSPOT_TOKEN_URL, new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
      code,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token, refresh_token, expires_in } = response.data;
    logger.info('OAuth tokens received', { expires_in });

    // In production: persist tokens securely per portal ID
    res.json({
      message: 'Authentication successful',
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    });
  } catch (err) {
    logger.error('OAuth callback error', { error: err.message });
    next(err);
  }
});

module.exports = router;
