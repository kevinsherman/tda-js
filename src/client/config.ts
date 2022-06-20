"use strict";

export interface Config {
  baseURL: string; // TD Ameritrade's API URL
  refreshAndRetry: boolean; // Refresh token and retry request if a 401 response is received
  returnFullResponse: boolean; // Return the full axios response instead of only the data
  apiKey?: string; // The API key (Client ID) provided by TD Ameritrade
  accessToken?: string; // The OAuth2 access token
  refreshToken?: string; // The OAuth2 refresh token
  accessTokenExpiresAt?: string; // The access token's date and time of expiration
  refreshTokenExpiresAt?: string; // The refresh token's date and time of expiration
  redirectUri?: string; // The local uri to receive the access code from TD Ameritrade's OAuth2
  accessType?: string;
  authCode?: string;
}

const config: Config = {
  baseURL: "https://api.tdameritrade.com/v1",
  refreshAndRetry: true,
  returnFullResponse: false,
};

export default config;
