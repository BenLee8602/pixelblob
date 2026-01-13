# pixelblob
pixelblob is a full-stack social media web app for sharing images.  
it is not currently deployed, but you can run it locally.
see installation guide below.

## technologies
- backend: javascript, express, mongoose, aws s3 sdk
- frontend: jsx, react, html, css
- storage: mongodb, aws s3
- test: jest, supertest, mongomemoryserver


## features

### scalability
- restful api and mongodb queries are paginated to handle large numbers of records
- `BigList` react component implements pagination (infinite scroll), see docs for more

### secure user account registration and login
- users can register a new account and login
- passwords are salted and hashed using bcrypt before storing in the database
- jsonwebtoken (jwt) is used to authenticate and authorize users, using encrypted access and refresh tokens

### image upload
- logged in users can upload images to be shared on their profile
- backend uses AWS S3 SDK to send images to an s3 bucket

### post, follow, like, comment
- logged in users can post images, follow other users, comment on posts, reply to comments, and like posts/comments/replies
- full crud functionality for each of these social media elements

### testability
- full test coverage over all rest api endpoints
- rest api routers use dependency injection for mongodb and aws s3, so mock dbs can be used during testing and development


## installation
clone repo
```
git clone https://github.com/BenLee8602/pixelblob.git pixelblob
cd pixelblob
```

### configuration
to run the app in prod, two .env files are required. one for the frontend, and backend.
if any env vars are missing, the app can still run using a mock db and s3.
be sure to keep the contents of these files secret for security purposes

#### backend
- `DB_CONNECTION_URI` connection string for a mongodb database
- `ACCESS_TOKEN_SECRET` secret string for creating and validating user access tokens
- `REFRESH_TOKEN_SECRET`  secret string for creating and validating user refresh tokens
- `AWS_BUCKET_NAME` name of aws s3 bucket
- `AWS_BUCKET_REGION` region of aws s3 bucket
- `AWS_ACCESS_KEY_ID` access key of aws s3 bucket
- `AWS_SECRET_ACCESS_KEY` password of aws s3 bucket

example contents of `pixelblob/.env`
```
DB_CONNECTION_URI=mongodb+srv://username:password@cluster0–41rmx.gcp.mongodb.net/database?retryWrites=true&w=majority

ACCESS_TOKEN_SECRET=9c88ec364b3d73224a8bbdb5dbf696dec342cd43278ceb9a2788db381066704e4fb09fe7dc1a2727f34a70627d24036b19d2856065bbfde04453c6f6a24f5133
REFRESH_TOKEN_SECRET=f036c3c75674d80dc7ee3533de9d902e2f174ead808b4f512345be0d90b8626b10b700a641bf0ef3ed50042eee810f790c91179039cce0e4f3b4a61a35594e37

AWS_BUCKET_NAME=pixelblob-bucket
AWS_BUCKET_REGION=us-east-1
AWS_ACCESS_KEY_ID=VUDOEWVLVNKCLVDJSIVN
AWS_SECRET_ACCESS_KEY=yr0fz8AalGRbmoZLE7o/LSxYDfIBdmbQ97AgZn5G
```

#### frontend
- `VITE_BACKEND_API` url to call backend api endpoints

example contents of `pixelblob/client/.env`
```
VITE_BACKEND_API=http://localhost:3000/api
```

### build
install packages
```
npm i
npm i --prefix client
```

build react app
```
npm run build --prefix client
```

start the server and go to `http://localhost:3000` to see the app!
```
npm start
```

for development, i recommend running the frontend and backend separately
```
npm run dev
npm run dev --prefix client
```

run rest api tests
```
npm run test
```

