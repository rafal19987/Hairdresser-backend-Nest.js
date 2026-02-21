export const jwtConstants = {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
};
