const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const { resetDbTestData, genTestAccessToken } = require("./testdata");
const app = require("./testapp");
const db = require("../src/config/db");
const img = require("../src/config/mocks3");


let mongodb;

beforeAll(async () => {
    mongodb = await MongoMemoryServer.create();
    await mongoose.connect(mongodb.getUri());
});

beforeEach(async () => {
    await resetDbTestData();
    img.resetImages();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongodb.stop();
});


describe("get comments for a post", () => {
    it("should return array of comments", async () => {
        const res = await request(app).get("/api/comments/63cf287bbc581a02576784aa").send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(3);
        for (const comment of res.body) expect(comment.parent).toBe("63cf287bbc581a02576784aa");
    });
});


describe("create comment", () => {
    it("should fail if comment text is missing", async () => {
        const accessToken = genTestAccessToken("someguy");
        const res = await request(app).post("/api/comments/63cf2bb1bc581a02576784e8").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            message: "wonderful weather were having!"
        });
        expect(res.statusCode).toBe(400);
    });


    it("should fail if post doesnt exist", async () => {
        const accessToken = genTestAccessToken("ben");
        const res = await request(app).post("/api/comments/d368d481cae2ad2fe90f6741").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "new comment from test 2"
        });
        expect(res.statusCode).toBe(404);
    });


    it("should create comment for valid post given comment text", async () => {
        const accessToken = genTestAccessToken("ben");
        const res = await request(app).post("/api/comments/63cf2bb1bc581a02576784e8").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "new comment from test 3"
        });
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findOne({
            parent: "63cf2bb1bc581a02576784e8",
            text: "new comment from test 3",
            author: "ben"
        });
        expect(comment).not.toBeNull();
    });
});


describe("like comment", () => {
    it("should fail if comment doesnt exist", async () => {
        const accessToken = genTestAccessToken("ben");
        const res = await request(app).put("/api/comments/0f65d7e90d604c9d82af37a8/like").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(404);
    });


    it("should like if not already", async () => {
        const accessToken = genTestAccessToken("ben");
        const res = await request(app).put("/api/comments/63cf29c8bc581a02576784b7/like").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findById("63cf29c8bc581a02576784b7");
        expect(comment.likes).toContain("ben");
    });


    it("should unlike if already liked", async () => {
        const accessToken = genTestAccessToken("someguy");
        const res = await request(app).put("/api/comments/63cf29c0bc581a02576784b3/like").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findById("63cf29c0bc581a02576784b3");
        expect(comment.likes).not.toContain("someguy");
    });
});


describe("edit a comment", () => {
    it("should fail if new text is not given", async () => {
        const accessToken = genTestAccessToken("someguy");
        const res = await request(app).put("/api/comments/63cf29f8bc581a02576784cb").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            msg: "hey!"
        });
        expect(res.statusCode).toBe(400);
    });


    it("should fail if comment doesnt exist", async () => {
        const accessToken = genTestAccessToken("someguy");
        const res = await request(app).put("/api/comments/1d42dba5a242fae43db013ff").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "hiii"
        });
        expect(res.statusCode).toBe(404);
    });


    it("should update a valid comment given a caption", async () => {
        const accessToken = genTestAccessToken("someguy");
        const res = await request(app).put("/api/comments/63cf29f8bc581a02576784cb").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "hi 2"
        });
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findById("63cf29f8bc581a02576784cb");
        expect(comment.text).toBe("hi 2");
    });
});


describe("delete a comment", () => {
    it("should fail if comment doesnt exist", async () => {
        const accessToken = genTestAccessToken("ben");
        const res = await request(app).delete("/api/comments/922375f85c0d1971cbc424cf").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(404);
    });


    it("should delete comment if exists", async () => {
        const accessToken = genTestAccessToken("someguy");
        const res = await request(app).delete("/api/comments/63cf2c42bc581a02576784f6").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findById("63cf2c42bc581a02576784f6");
        expect(comment).toBeNull();
    });
});