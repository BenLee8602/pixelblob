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


describe("get comments for a post", () => {
    it("should return array of comments", async () => {
        const res = await request(app).get("/api/comments/63cf287bbc581a02576784aa").send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(2);
        for (const comment of res.body) expect(comment.parent).toBe("63cf287bbc581a02576784aa");
    });


    it("should be paginated", async () => {
        const res = await request(app).get(`/api/comments/63cf287bbc581a02576784aa?page=1`).send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
    });
});


describe("create comment", () => {
    it("should fail if comment text is missing", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).post("/api/comments/post/63cf2bb1bc581a02576784e8").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            message: "wonderful weather were having!"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body).toBe("missing comment text");
    });


    it("should fail if parent type is invalid", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).post("/api/comments/someInvalidType/63cf2bb1bc581a02576784e8").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "testing 123"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body).toBe("parent type must be \"post\" or \"comment\"");
    });


    it("should fail if parent is not found", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).post("/api/comments/post/63cf278abc581a025767848d").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "oops wrong id"
        });
        expect(res.statusCode).toBe(404);
    });

    
    it("should fail if parent is a reply", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).post("/api/comments/comment/63cf29d5bc581a02576784bb").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "replying to a reply"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body).toBe("parent cannot be a reply");
    });


    it("should create comment for valid post given comment text", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).post("/api/comments/post/63cf2bb1bc581a02576784e8").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "new comment from test 3"
        });
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findOne({
            parent: "63cf2bb1bc581a02576784e8",
            text: "new comment from test 3",
            author: "63cf278abc581a025767848d"
        });
        expect(comment).not.toBeNull();

        const parent = await db.posts.findById("63cf2bb1bc581a02576784e8");
        expect(parent.commentCount).toBe(2);
    });
});


describe("edit a comment", () => {
    it("should fail if new text is not given", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).put("/api/comments/63cf29f8bc581a02576784cb").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            msg: "hey!"
        });
        expect(res.statusCode).toBe(400);
    });


    it("should fail if comment doesnt exist", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).put("/api/comments/1d42dba5a242fae43db013ff").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "hiii"
        });
        expect(res.statusCode).toBe(404);
    });


    it("should update a valid comment given a caption", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
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
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).delete("/api/comments/922375f85c0d1971cbc424cf").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(404);
    });


    it("should delete comment if exists", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).delete("/api/comments/63cf2c42bc581a02576784f6").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findById("63cf2c42bc581a02576784f6");
        expect(comment).toBeNull();

        const parent = await db.posts.findById("63cf2bb1bc581a02576784e8");
        expect(parent.commentCount).toBe(0);

        const cCount = await db.comments.count({});
        const lCount = await db.likes.count({});
        expect(cCount).toBe(6);
        expect(lCount).toBe(9);
    });
});
