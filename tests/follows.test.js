import request from "supertest";

import app from "../src/app";
import auth from "../src/config/auth";
import db from "../src/config/db";
import img from "../src/config/img";


beforeAll(async () => await db.connect());
afterAll(async () => await db.disconnect());

afterEach(async () => {
    await db.resetData();
    img.resetImages();
});


describe("follow a user", () => {
    it("should not allow following oneself", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).put(
            "/api/follows/695ee08e62610f325ee6fa06"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(400);
    });


    it("should not allow following nonexistent user", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).put("/api/follows/922375f85c0d1971cbc424cf").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(404);
    });


    it("should follow if not already following", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).put(
            "/api/follows/695ee08e62610f325ee6fa0d"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(201);

        const fol = await db.follows.find({
            follower: "695ee08e62610f325ee6fa06",
            following: "695ee08e62610f325ee6fa0d"
        });
        expect(fol).not.toBeNull();

        const follower  = await db.users.findOne({ name: "id.ex" });
        const following = await db.users.findOne({ name: "tempor.amet" });
        expect(follower.followingCount).toBe(1);
        expect(following.followerCount).toBe(1);
    });


    it("should unfollow if already following", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09062610f325ee6fb5e", "magna.veniam");
        const res = await request(app).put(
            "/api/follows/695ee09162610f325ee6fba4"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const follower  = await db.users.findOne({ name: "magna.veniam" });
        const following = await db.users.findOne({ name: "occaecat.irure" });
        expect(follower.followingCount).toBe(10);
        expect(following.followerCount).toBe(7);
    });
});


describe("get followers", () => {
    it("should return a list of followers for a given user", async () => {
        const res = await request(app).get(
            "/api/follows/695ee08f62610f325ee6fac3/followers"
        ).send();
        expect(res.statusCode).toBe(200);

        const expected = [
            'magna.velit',
            'ex.cupidatat',
            'qui.sint',
            'laboris.voluptate'
        ];

        expect(res.body.length).toBe(expected.length);
        for (let i = 0; i < expected.length; i++) {
            expect(res.body[i].name).toBe(expected[i]);
        }
    });
});


describe("get following", () => {
    it("should return a list of following for a given user", async () => {
        const res = await request(app).get(
            "/api/follows/695ee08f62610f325ee6fac3/following"
        ).send();
        expect(res.statusCode).toBe(200);

        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe("id.enim");
    });
});

