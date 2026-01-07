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


describe("get all posts", () => {
    it("should return all posts in db", async () => {
        const res = await request(app).get("/api/posts").send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(2);
    });
});


describe("get post by id", () => {
    it("should fail if post doesnt exist", async () => {
        const res = await request(app).get("/api/posts/e020ee4ae7584f86e1fe33f7").send();
        expect(res.statusCode).toBe(404);
    });


    it("should return post if exists", async () => {
        const res = await request(app).get("/api/posts/63cf287bbc581a02576784aa").query({
            cur: "63cf278abc581a025767848d"
        }).send();
        expect(res.statusCode).toBe(200);
        delete res.body.posted;
        expect(res.body).toStrictEqual({
            _id: "63cf287bbc581a02576784aa",
            author: {
                _id: "63cf278abc581a025767848d",
                name: "ben",
                pfp: "http://localhost:3000/img/bensProfilePicture",
                nick: "benjamin"
            },
            image: "http://localhost:3000/img/post1Image",
            caption: "a cool caption",
            likeCount: 2,
            commentCount: 3,
            liked: true
        });
    });
});


describe("get posts by author", () => {
    it("should return all posts created by author", async () => {
        const res = await request(app).get("/api/posts/author/63cf278abc581a025767848d").send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(2);
        for (const post of res.body) expect(post.author.name).toBe("ben");
    });
});


describe("search posts", () => {
    it("should search by caption", async () => {
        const res = await request(app).get("/api/posts/search/COOL").send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        for (const post of res.body) expect(post.caption).toMatch(/cool/i);
    });
});


describe("create new post", () => {
    it("should add the post to the database", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).post("/api/posts").set({
            "Authorization": "Bearer " + accessToken
        }).attach("image", Buffer.from("new post image buffer"), "image").field({
            caption: "awesome caption"
        });
        expect(res.statusCode).toBe(200);
        
        const posts = await db.posts.find({});
        expect(posts.length).toBe(3);

        const author = await db.users.findOne({ name: "someguy" });
        expect(author.postCount).toBe(1);
    });
});


describe("edit a post", () => {
    it("should fail if caption is not given", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).put("/api/posts/63cf287bbc581a02576784aa").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            msg: "how are you"
        });
        expect(res.statusCode).toBe(400);
    });


    it("should fail if post doesnt exist", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "someguy");
        const res = await request(app).put("/api/posts/01abe3720d6e382d80970673").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            caption: "this is a new caption"
        });
        expect(res.statusCode).toBe(404);
    });


    it("should update a valid post given a caption", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).put("/api/posts/63cf287bbc581a02576784aa").set({
            "Authorization": "Bearer " + accessToken
        }).send({
            caption: "crazy caption"
        });
        expect(res.statusCode).toBe(200);

        const post = await db.posts.findById("63cf287bbc581a02576784aa");
        expect(post.caption).toBe("crazy caption");
    });
});


describe("delete a post", () => {
    it("should fail if post doesnt exist", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).delete("/api/posts/cb760905e8fa1745e1457e0b").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(404);
    });


    it("should delete post if exists", async () => {
        const accessToken = auth.createAccessToken(
            "63cf278abc581a025767848d", "ben");
        const res = await request(app).delete("/api/posts/63cf2bb1bc581a02576784e8").set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const post = await db.posts.findById("63cf2bb1bc581a02576784e8");
        expect(post).toBeNull();

        const author = await db.users.findOne({ name: "ben" });
        expect(author.postCount).toBe(1);

        const cCount = await db.comments.count({});
        const lCount = await db.likes.count({});
        expect(cCount).toBe(7);
        expect(lCount).toBe(10);
    });
});
