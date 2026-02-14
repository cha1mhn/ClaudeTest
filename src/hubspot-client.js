import hubspot from '@hubspot/api-client';

export function createClient(accessToken) {
  return new hubspot.Client({ accessToken });
}
