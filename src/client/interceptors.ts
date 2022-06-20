"use strict";

import axios from "axios";
import { get } from "lodash";
import Base from "./base";

function appendAccessToken(client: Base): void {
  client.axios.interceptors.request.use((request) => {
    if (client.config.accessToken) {
      request.headers!.Authorization = `Bearer ${client.config.accessToken}`;
    }

    return request;
  });
} // appendAccessToken()

/**
 * Update config when a new token is received.
 */
function updateConfigOnNewToken(client: Base): void {
  client.axios.interceptors.response.use((response) => {
    if (response.config.url === "/oauth2/token") {
      const token = parseToken(response.data);
      Object.assign(client.config, token);
      client._emitter.emit("token", token);
    }

    return response;
  });
} // updateConfigOnNewToken()

/**
 * Refresh token and retry request on status code 401.
 */
function refreshAndRetry(client: Base): void {
  client.axios.interceptors.response.use(undefined, (error) => {
    const originalRequest = error.config;
    const condition =
      client.config.refreshAndRetry &&
      get(error, "response.status") === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/oauth2/token";

    if (condition) {
      originalRequest._retry = true;
      return client.refreshAccessToken().then(() => {
        originalRequest.headers.Authorization = `Bearer ${client.config.accessToken}`;
        return axios(originalRequest);
      });
    }

    return Promise.reject(error);
  });
} // refreshAndRetry()

/**
 * Return the full Axios response.
 */
function fullResponse(client: Base): void {
  client.axios.interceptors.response.use(
    (response) => {
      return client.config.returnFullResponse ? response : get(response, "data");
    },
    (error) => {
      // we don't want to Promise.reject() as it will
      // trigger an ERR_UNHANDLED_REJECTION error.

      // axios response
      if (client.config.returnFullResponse) {
        throw error;
      }

      // custom error response
      if (error.response) {
        const customError = {
          status: get(error, "response.status"),
          error: get(error, "response.data.error"),
        };

        throw customError;
      }

      // extract error
      const customError = new Error(error.message);
      customError.stack = error.stack;
      throw customError;
    }
  );
} // fullResponse()

//#region helpers

/**
 * Transform the given token object
 *
 * @private
 * @param {object} data Token info return from oauth endpoint
 * @returns {object} Transformed token object
 */
function parseToken(data: any): any {
  const res = {
    accessToken: data.access_token,
    accessTokenExpiresAt: timeFromNow(data.expires_in),
    refreshToken: data.refresh_token,
    refreshTokenExpiresAt: timeFromNow(data.refresh_token_expires_in),
    scope: data.scope,
    tokenType: data.token_type,
  };

  // remove props with falsey values
  return filterObj(res, (value: any) => value);
} // parseToken()

/**
 * Get the UTC time from now
 *
 * @private
 * @param {number} seconds Number of seconds
 * @returns {string|undefined} UTC time string or undefined
 */
function timeFromNow(seconds: number): string | undefined {
  return seconds ? new Date(Date.now() + 1000 * seconds).toISOString() : undefined;
} // getTimeFromNow()

/**
 * Filter object
 *
 * @private
 * @param {object} obj Object to filter
 * @param {Function} cb Callback
 * @returns {object} Filtered object
 */
function filterObj(obj: any, cb: Function): object {
  return Object.keys(obj).reduce((acc, cur) => {
    if (cb(obj[cur], cur)) {
      //@ts-ignore
      acc[cur] = obj[cur];
    }
    return acc;
  }, {});
} // filterObj()

//#endregion

const interceptors = {
  appendAccessToken,
  updateConfigOnNewToken,
  refreshAndRetry,
  fullResponse,
};

/**
 * Add all interceptors to the client's axios instance.
 *
 * @private
 * @param {Base} client Client
 * @returns {void}
 */
function setup(client: Base): void {
  //@ts-ignore
  Object.keys(interceptors).forEach((key) => interceptors[key](client));
}

export default Object.assign({}, interceptors, { setup });
