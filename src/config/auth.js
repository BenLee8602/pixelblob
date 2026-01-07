import jwt from "jsonwebtoken";

import isProd from "./isProd.js";


const refreshEnvVar = process.env.REFRESH_TOKEN_SECRET;
const accessEnvVar  = process.env.ACCESS_TOKEN_SECRET;

const refreshTokenSecret = isProd ? refreshEnvVar : "refresh";
const accessTokenSecret  = isProd ? accessEnvVar  : "access";


function createRefreshToken(id, name) {
    return jwt.sign({ id, name }, refreshTokenSecret);
}

function createAccessToken(id, name) {
    return jwt.sign({ id, name }, accessTokenSecret, { expiresIn: "15m" });
}


function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, refreshTokenSecret);
    } catch (err) {
        return null;
    }
}

function verifyAccessToken(token) {
    try {
        return jwt.verify(token, accessTokenSecret);
    } catch (err) {
        return null;
    }
}


export default {
    createRefreshToken,
    createAccessToken,
    verifyRefreshToken,
    verifyAccessToken
};

