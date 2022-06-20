"use strict";

import axios from "axios";
import defaults, { Config } from "./config";
import EventEmitter from "eventemitter3";
import interceptors from "./interceptors";
const apiKeySuffix = "@AMER.OAUTHAP";

class Base {
  _emitter: EventEmitter;
  config: Config;
  axios;

  constructor(config: Config) {
    this._emitter = new EventEmitter();

    this.config = Object.assign(
      {},
      defaults,
      config,
      (function () {
        if (config) {
          return {
            apiKey: (config.apiKey + "").endsWith(apiKeySuffix)
              ? config.apiKey
              : config.apiKey + apiKeySuffix,
          };
        }
      })()
    ); // config

    this.axios = axios.create({ baseURL: this.config.baseURL });

    interceptors.setup(this);
  }

  on(
    event: "login" | "token",
    fn: EventEmitter.EventListener<any, any>
  ): EventEmitter<string | symbol, any> {
    return this._emitter.on(event, fn);
  }

  getAccessToken(authCode: string) {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("access_type", this.config.accessType || "offline");
    params.append("client_id", this.config.apiKey!);
    params.append("redirect_uri", this.config.redirectUri!);
    params.append("code", authCode || this.config.authCode!);

    delete this.config.accessToken;

    return this.axios.post("/oauth2/token", params);
  } // getAccessToken()

  refreshAccessToken(refreshToken?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("access_type", this.config.accessType || "offline");
    params.append("client_id", this.config.apiKey!);
    params.append("refresh_token", refreshToken || this.config.refreshToken!);

    delete this.config.accessToken;

    return this.axios.post("/oauth2/token", params);
  } // refreshAccessToken()

  isAccessTokenExpired(): boolean {
    return this.config.accessTokenExpiresAt
      ? new Date(this.config.accessTokenExpiresAt).getTime() <= Date.now()
      : true;
  } // isAccessTokenExpired()

  isRefreshTokenExpired() {
    return this.config.refreshTokenExpiresAt
      ? new Date(this.config.refreshTokenExpiresAt).getTime() <= Date.now()
      : true;
  } // isRefreshTokenExpired()
} // Base

export default Base;
