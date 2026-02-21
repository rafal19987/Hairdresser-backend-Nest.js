import {StringValue} from 'ms';

export const jwtConstants = {
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET_KEY as StringValue,
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET_KEY as StringValue,
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN as StringValue,
  refreshTokenExpiresIn: process.env
    .JWT_REFRESH_TOKEN_EXPIRES_IN as StringValue,
};

export const INVITATION_TOKEN_TTL_HOURS = 48;