function getPageInfo(req, res, next) {
    let number = parseInt(req.query.page);
    if (isNaN(number) || number < 0) number = 0;

    let start = parseInt(req.query.start);
    start = isNaN(start) ? new Date() : new Date(start);

    req.page = { number, start };
    next();
}


export { getPageInfo };

