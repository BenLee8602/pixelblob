import request from "supertest";

import app from "../src/app";
import auth from "../src/config/auth";
import db from "../src/config/db";
import img from "../src/config/img";


beforeAll(async () => await db.connect());
afterAll(async () => await db.disconnect());

afterEach(async () => {
    await db.resetData();
    await img.resetImages();
});


describe("register user", () => {
    it("should fail if username or password is missing", async () => {
        const res = await request(app).post(
            "/api/users/register"
        ).send({
            name: "username123"
        });
        expect(res.statusCode).toBe(400);
        
        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();

        expect(await db.users.findOne({ name: "username123" })).toBeNull();
    });


    it("should fail if username is taken", async () => {
        const res = await request(app).post(
            "/api/users/register"
        ).send({
            name: "id.ex",
            pass: "abc123"
        });
        expect(res.statusCode).toBe(409);
        
        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();
    });


    it("should pass given password and unique username", async () => {
        const tokenCountBefore = await db.tokens.countDocuments({});

        const res = await request(app).post(
            "/api/users/register"
        ).send({
            name: "ben",
            pass: "asd456"
        });
        expect(res.statusCode).toBe(200);
        
        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.accessToken).toBeDefined();

        const newUser = await db.users.findOne({ name: "ben" });
        expect(newUser).toBeDefined();
        expect(newUser.name).toBe("ben");
        expect(newUser.pass).not.toBe("asd456"); // should be hashed
        expect(await db.tokens.countDocuments({})).toBe(tokenCountBefore + 1);
    });
});


describe("login user", () => {
    it("should fail if username or password is missing", async () => {
        const tokenCountBefore = await db.tokens.countDocuments({});

        const res = await request(app).post(
            "/api/users/login"
        ).send({
            pass: "id's pass"
        });
        expect(res.statusCode).toBe(400);

        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();

        expect(await db.tokens.countDocuments({})).toBe(tokenCountBefore);
    });


    it("should fail if user is not found", async () => {
        const tokenCountBefore = await db.tokens.countDocuments({});

        const res = await request(app).post(
            "/api/users/login"
        ).send({
            name: "doesntexist",
            pass: "id's pass"
        });
        expect(res.statusCode).toBe(404);

        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();

        expect(await db.tokens.countDocuments({})).toBe(tokenCountBefore);
    });


    it("should fail if password is incorrect", async () => {
        const tokenCountBefore = await db.tokens.countDocuments({});

        const res = await request(app).post(
            "/api/users/login"
        ).send({
            name: "id.ex",
            pass: "wrongpassword"
        });
        expect(res.statusCode).toBe(401);

        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();

        expect(await db.tokens.countDocuments({})).toBe(tokenCountBefore);
    });


    it("should pass given valid credentials", async () => {
        const tokenCountBefore = await db.tokens.countDocuments({});

        const res = await request(app).post(
            "/api/users/login"
        ).send({
            name: "id.ex",
            pass: "id's pass"
        });
        expect(res.statusCode).toBe(200);

        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.accessToken).toBeDefined();

        expect(await db.tokens.countDocuments({})).toBe(tokenCountBefore + 1);
    });
});


describe("get new access token", () => {
    it("should fail if refresh token is missing", async () => {
        const res = await request(app).post(
            "/api/users/refresh"
        ).send();
        expect(res.statusCode).toBe(400);
        expect(res.body.accessToken).toBeUndefined();
        expect(res.body.user).toBeUndefined();
    });


    it("should fail given an invalid token", async () => {
        const res = await request(app).post(
            "/api/users/refresh"
        ).send({
            refreshToken: "faketoken"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body).toBe("invalid refresh token");
        expect(res.body.accessToken).toBeUndefined();
        expect(res.body.user).toBeUndefined();
    });


    it("should fail given an old token", async () => {
        const res = await request(app).post(
            "/api/users/refresh"
        ).send({
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0Yzg2ZDJlYzA1OWRmZjhlNjJiMjg2NiIsIm5hbWUiOiJiZW4iLCJpYXQiOjE2OTA5MjQzMjd9.B4W0EqfHXkZVfHXZuhYeBHaPtHMsRLKOjuBp43jsYVA"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body).toBe("invalid refresh token");
        expect(res.body.accessToken).toBeUndefined();
        expect(res.body.user).toBeUndefined();
    });


    it("should pass given a valid, active refesh token", async () => {
        const res = await request(app).post(
            "/api/users/refresh"
        ).send({
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NWVlMDhlNjI2MTBmMzI1ZWU2ZmEwNiIsIm5hbWUiOiJpZC5leCIsImlhdCI6MTc2NzgyNTU1MH0.EnapS26M5GHsfnFD3XnFwl01Qn1oWad2PEJK0MsfYuY"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user).toStrictEqual({
            id: "695ee08e62610f325ee6fa06",
            name: "id.ex"
        });
    });
});


describe("logout user", () => {
    it("should delete token from database", async () => {
        const res = await request(app).delete(
            "/api/users/logout"
        ).send({
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NWVlMDhlNjI2MTBmMzI1ZWU2ZmEwNiIsIm5hbWUiOiJpZC5leCIsImlhdCI6MTc2NzgyNTU1MH0.EnapS26M5GHsfnFD3XnFwl01Qn1oWad2PEJK0MsfYuY"
        });
        expect(res.statusCode).toBe(200);
        expect(await db.tokens.findById(
            "695ee08e62610f325ee6fa08")).toBeNull();
    });
});


describe("search users", () => {
    it("should accept partial match and ignore case", async () => {
        const res = await request(app).get(
            "/api/users/search/ID.E"
        ).send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(3);
        for (const user of res.body) expect(user.name).toMatch(/ID\.E/i);
    });
});


describe("get one user's data", () => {
    it("should fail if user doesnt exist", async () => {
        const res = await request(app).get(
            "/api/users/doesntExist/profile"
        ).send();
        expect(res.statusCode).toBe(404);
    });


    it("should pass if user exists", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).get(
            "/api/users/quis.occaecat/profile"
        ).query({
            cur: "695ee09062610f325ee6fb18"
        }).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        expect(res.body.name).toBe("quis.occaecat");
        expect(res.body.nick).toBe("voluptate");
        expect(res.body.followerCount).toBe(1);
        expect(res.body.following).toBe(true);
    });
});


describe("edit user profile", () => {
    it("should only update nickname and bio if no pfp given", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).put(
            "/api/users/profile"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            nick: "new nickname",
            bio: "new bio"
        });
        expect(res.statusCode).toBe(200);

        const user = await db.users.findOne({ name: "id.ex" });
        expect(user.nick).toBe("new nickname");
        expect(user.bio).toBe("new bio");
        expect(user.pfp).toBe("");
    });


    it("should replace old pfp if it exists", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa0d", "tempor.amet");
        const res = await request(app).put(
            "/api/users/profile"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).attach(
            "image", Buffer.from("dummy"), "image"
        ).field({
            nick: "nickname from test 3",
            bio: "bio from test 3"
        });
        expect(res.statusCode).toBe(200);

        const user = await db.users.findOne({ name: "tempor.amet" });
        expect(user.nick).toBe("nickname from test 3");
        expect(user.bio).toBe("bio from test 3");
        expect(user.pfp).toBe("6313e384e204ef9ae481f1f9708d6b2c-168-201");
    });


    it("should create new pfp if not exists", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).put(
            "/api/users/profile"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).attach("image", Buffer.from("dummy"), "image").field({
            nick: "test 4 nickname",
            bio: "test 4 bio"
        });
        expect(res.statusCode).toBe(200);

        const user = await db.users.findOne({ name: "id.ex" });
        expect(user.nick).toBe("test 4 nickname");
        expect(user.bio).toBe("test 4 bio");
        expect(user.pfp).not.toBe("");
    });
});


describe("delete user profile", () => {
    it("should delete user and all related data", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09062610f325ee6fb10", "ex.cupidatat");
        const res = await request(app).delete(
            "/api/users/profile"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        expect(await db.users.findOne({
            name: "ex.cupidatat"
        })).toBeNull();
        expect(await db.posts.countDocuments({
            author: "695ee09062610f325ee6fb10"
        })).toBe(0);
        expect(await db.comments.countDocuments({
            author: "695ee09062610f325ee6fb10"
        })).toBe(0);
        expect(await db.follows.countDocuments({
            follower: "695ee09062610f325ee6fb10"
        })).toBe(0);
        expect(await db.follows.countDocuments({
            following: "695ee09062610f325ee6fb10"
        })).toBe(0);
        expect(await db.likes.countDocuments({
            likedBy: "695ee09062610f325ee6fb10"
        })).toBe(0);
    });
});
