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


describe("smash the like button", () => {
    it("should fail if parent type is invalid", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).put("/api/likes/someInvalidType/63cf2c5cbc581a0257678503").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(400);
    });


    it("should fail if parent doesnt exist", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).put("/api/likes/post/5fbca0a35e06b136c429a22a").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(404);
    });


    it("should like if not already liked", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).put("/api/likes/comment/63cf2c5cbc581a0257678503").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(201);

        const like = await db.likes.findOne({
            parent: "63cf2c5cbc581a0257678503",
            likedBy: "63cf278abc581a025767848d"
        });
        expect(like).not.toBeNull();

        const parent = await db.comments.findById("63cf2c5cbc581a0257678503");
        expect(parent.likeCount).toBe(1);
    });


    it("should unlike if already liked", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).put("/api/likes/post/63cf287bbc581a02576784aa").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const like = await db.likes.findOne({
            parent: "63cf287bbc581a02576784aa",
            likedBy: "63cf27d7bc581a0257678496"
        });
        expect(like).toBeNull();

        const parent = await db.posts.findById("63cf287bbc581a02576784aa");
        expect(parent.likeCount).toBe(1);
    });
});


describe("get likes", () => {
    it("should return a list of users that smashed the like button", async () => {
        const res = await request(app).get("/api/likes/63cf29c0bc581a02576784b3").send();
        expect(res.statusCode).toBe(200);

        const expected = [{
            _id: "63cf278abc581a025767848d",
            name: "ben",
            pfp: "http://localhost:3000/img/bensProfilePicture",
            nick: "benjamin"
        }, {
            _id: "63cf27d7bc581a0257678496",
            name: "someguy",
            pfp: "",
            nick: "awesome nickname"
        }];
        expect(JSON.stringify(res.body)).toBe(JSON.stringify(expected));
    });
});
