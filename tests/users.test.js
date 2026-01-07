const request = require("supertest");

const app = require("../src/app");
const auth = require("../src/config/auth");
const db = require("../src/config/db");
const img = require("../src/config/img");


beforeAll(async () => await db.connect());
afterAll(async () => await db.disconnect());

afterEach(async () => {
    await db.resetData();
    img.resetImages();
});


describe("register user", () => {
    it("should fail if username or password is missing", async () => {
        const res = await request(app).post("/api/users/register").send({
            name: "username123"
        });
        expect(res.statusCode).toBe(400);
        
        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();

        expect(await db.users.findOne({ name: "username123" })).toBeNull();
        expect((await db.tokens.find({})).length).toBe(1);
    });


    it("should fail if username is taken", async () => {
        const res = await request(app).post("/api/users/register").send({
            name: "BEN",
            pass: "abc123"
        });
        expect(res.statusCode).toBe(409);
        
        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();

        expect((await db.users.find({})).length).toBe(2);
        expect((await db.tokens.find({})).length).toBe(1);
    });


    it("should pass given password and unique username", async () => {
        const res = await request(app).post("/api/users/register").send({
            name: "ben2",
            pass: "asd456"
        });
        expect(res.statusCode).toBe(200);
        
        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.accessToken).toBeDefined();

        const newUser = await db.users.findOne({ name: "ben2" });
        expect(newUser).toBeDefined();
        expect(newUser.name).toBe("ben2");
        expect(newUser.pass).not.toBe("asd456"); // should be hashed
        expect((await db.tokens.find({})).length).toBe(2);
    });
});


describe("login user", () => {
    it("should fail if username or password is missing", async () => {
        const res = await request(app).post("/api/users/login").send({
            pass: "abc"
        });
        expect(res.statusCode).toBe(400);

        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();

        expect((await db.tokens.find({})).length).toBe(1);
    });


    it("should fail if user is not found", async () => {
        const res = await request(app).post("/api/users/login").send({
            name: "doesntexist",
            pass: "p@s$w0Rd"
        });
        expect(res.statusCode).toBe(404);

        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();

        expect((await db.tokens.find({})).length).toBe(1);
    });


    it("should fail if password is incorrect", async () => {
        const res = await request(app).post("/api/users/login").send({
            name: "ben",
            pass: "wrongpassword"
        });
        expect(res.statusCode).toBe(401);

        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();

        expect((await db.tokens.find({})).length).toBe(1);
    });


    it("should pass given valid credentials", async () => {
        const res = await request(app).post("/api/users/login").send({
            name: "ben",
            pass: "abc"
        });
        expect(res.statusCode).toBe(200);

        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.accessToken).toBeDefined();

        expect((await db.tokens.find({})).length).toBe(2);
    });
});


describe("get new access token", () => {
    it("should fail if refresh token is missing", async () => {
        const res = await request(app).post("/api/users/refresh").send();
        expect(res.statusCode).toBe(400);
        expect(res.body.accessToken).toBeUndefined();
        expect(res.body.user).toBeUndefined();
    });


    it("should fail given an invalid token", async () => {
        const res = await request(app).post("/api/users/refresh").send({
            refreshToken: "faketoken"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body).toBe("invalid refresh token");
        expect(res.body.accessToken).toBeUndefined();
        expect(res.body.user).toBeUndefined();
    });


    it("should fail given an old token", async () => {
        const res = await request(app).post("/api/users/refresh").send({
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0Yzg2ZDJlYzA1OWRmZjhlNjJiMjg2NiIsIm5hbWUiOiJiZW4iLCJpYXQiOjE2OTA5MjQzMjd9.B4W0EqfHXkZVfHXZuhYeBHaPtHMsRLKOjuBp43jsYVA"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body).toBe("invalid refresh token");
        expect(res.body.accessToken).toBeUndefined();
        expect(res.body.user).toBeUndefined();
    });


    it("should pass given a valid, active refesh token", async () => {
        const res = await request(app).post("/api/users/refresh").send({
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0Yzg2ZDJlYzA1OWRmZjhlNjJiMjg2NiIsIm5hbWUiOiJiZW4iLCJpYXQiOjE2OTA5Mjg4NDl9.NNXicoBIiLBkXSMSvh3yOs8R80AlEiXR2fFqhTPAdg0"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user).toStrictEqual({ id: "64c86d2ec059dff8e62b2866", name: "ben" });
    });
});


describe("logout user", () => {
    it("should delete token from database", async () => {
        const res = await request(app).delete("/api/users/logout").send({
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0Yzg2ZDJlYzA1OWRmZjhlNjJiMjg2NiIsIm5hbWUiOiJiZW4iLCJpYXQiOjE2OTA5Mjg4NDl9.NNXicoBIiLBkXSMSvh3yOs8R80AlEiXR2fFqhTPAdg0"
        });
        expect(res.statusCode).toBe(200);
        expect((await db.tokens.find({})).length).toBe(0);
    });
});


describe("search users", () => {
    it("should accept partial match and ignore case", async () => {
        const res = await request(app).get("/api/users/search/En").send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        for (const user of res.body) expect(user.name).toMatch(/En/i);
    });
});


describe("get one user's data", () => {
    it("should fail if user doesnt exist", async () => {
        const res = await request(app).get("/api/users/doesntExist/profile").send();
        expect(res.statusCode).toBe(404);
    });


    it("should pass if user exists", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).get("/api/users/ben/profile").query({
            cur: "63cf27d7bc581a0257678496"
        }).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const expected = {
            _id: "63cf278abc581a025767848d",
            name: "ben",
            pfp: "http://localhost:3000/img/bensProfilePicture",
            nick: "benjamin",
            bio: "hi my name is ben",
            postCount: 2,
            followerCount: 1,
            followingCount: 0,
            __v: 0,
            following: true
        };

        expect(JSON.stringify(res.body)).toBe(JSON.stringify(expected));
    });
});


describe("edit user profile", () => {
    it("should only update nickname and bio if no pfp given", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).put("/api/users/profile").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            nick: "new nickname",
            bio: "new bio"
        });
        expect(res.statusCode).toBe(200);

        const user = await db.users.findOne({ name: "someguy" });
        expect(user.nick).toBe("new nickname");
        expect(user.bio).toBe("new bio");
        expect(user.pfp).toBe("");
    });


    it("should replace old pfp if it exists", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).put("/api/users/profile").set({
            "Authorization": "Bearer " + accessToken
        }).attach("image", Buffer.from("test 3 pfp buffer"), "image").field({
            nick: "nickname from test 3",
            bio: "bio from test 3"
        });
        expect(res.statusCode).toBe(200);

        const user = await db.users.findOne({ name: "ben" });
        expect(user.nick).toBe("nickname from test 3");
        expect(user.bio).toBe("bio from test 3");
        expect(user.pfp).toBe("bensProfilePicture");
    });


    it("should create new pfp if not exists", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).put("/api/users/profile").set({
            "Authorization": "Bearer " + accessToken
        }).attach("image", Buffer.from("test 4 pfp buffer"), "image").field({
            nick: "test 4 nickname",
            bio: "test 4 bio"
        });
        expect(res.statusCode).toBe(200);

        const user = await db.users.findOne({ name: "someguy" });
        expect(user.nick).toBe("test 4 nickname");
        expect(user.bio).toBe("test 4 bio");
        expect(user.pfp).not.toBe("");
    });
});


describe("delete user profile", () => {
    it("should delete user and all related data", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).delete("/api/users/profile").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const users = await db.users.count({});
        const posts = await db.posts.count({});
        const comments = await db.comments.count({});
        const follows = await db.follows.count({});
        const likes = await db.likes.count({});

        expect(users).toBe(1);
        expect(posts).toBe(0);
        expect(comments).toBe(3);
        expect(follows).toBe(0);
        expect(likes).toBe(6);
    });
});
