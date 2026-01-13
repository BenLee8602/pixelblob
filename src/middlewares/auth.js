import auth from "../config/auth.js";


function requireLogin(req, res, next) {
    const tokenHead = req.headers["authorization"];
    if (!tokenHead) return res.status(401).json("missing auth header");

    const token = tokenHead.split(' ')[1];
    if (!token) return res.status(401).json("missing access token");

    const payload = auth.verifyAccessToken(token);
    if (!payload) return res.status(401).json("invalid access token");

    req.user = payload;
    next();
}


export { requireLogin };

