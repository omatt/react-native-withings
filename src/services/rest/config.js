import { CLIENT_ID } from '@env';

// Set STATE parameter
// See: https://developer.withings.com/developer-guide/v3/integration-guide/public-health-data-api/get-access/oauth-authorization-url
const STATE = Date.now().toString();

export const END_DATE = Math.floor(Date.now() / 1000); // now
export const START_DATE = END_DATE - 7 * 24 * 60 * 60;   // last 7 days
export const LAST_48_HOURS = END_DATE - 2 * 24 * 60 * 60;   // last 24 hours
export const LAST_24_HOURS = END_DATE - 24 * 60 * 60;   // last 2 days

// Withings OAuth2 URLs
export const BASE_URL = 'https://account.withings.com/oauth2_user/authorize2';
// Set OAuth Scope
// See: https://developer.withings.com/developer-guide/v3/integration-guide/public-health-data-api/get-access/oauth-authorization-url#scopes
export const SCOPE = 'user.activity,user.metrics';

export const REDIRECT_URI = 'idm://callback'; //Ensure this callback is set in Withings settings
export const AUTHORIZATION_URL = `${BASE_URL}?client_id=${CLIENT_ID}&response_type=code&scope=${SCOPE}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
export const TOKEN_BASE_URL = 'https://wbsapi.withings.net/v2';
export const TOKEN_OAUTH2_URL = `${TOKEN_BASE_URL}/oauth2`;
export const TOKEN_URL = `${TOKEN_OAUTH2_URL}?action=requesttoken`;
export const TOKEN_SLEEP_URL = `${TOKEN_BASE_URL}/sleep`;
export const TOKEN_HEART_URL = `${TOKEN_BASE_URL}/heart`;

// Token expiration
// See: https://developer.withings.com/developer-guide/v3/integration-guide/dropship-cellular/get-access/access-and-refresh-tokens/
export const ACCESS_TOKEN_EXPIRATION = 3 * 60 * 60 * 1000; // 3 hours
export const REFRESH_TOKEN_EXPIRATION = 12 * 30 * 24 * 60 * 60 * 1000; // 1 year

