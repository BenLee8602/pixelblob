export default (
    process.env.WANT_DEV === undefined &&

    process.env.DB_CONNECTION_URI !== undefined &&

    process.env.ACCESS_TOKEN_SECRET !== undefined &&
    process.env.REFRESH_TOKEN_SECRET !== undefined &&

    process.env.AWS_BUCKET_NAME !== undefined &&
    process.env.AWS_BUCKET_REGION !== undefined &&
    process.env.AWS_ACCESS_KEY_ID !== undefined &&
    process.env.AWS_SECRET_ACCESS_KEY !== undefined
);

