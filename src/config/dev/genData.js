// this is the script used to generate ./data.json.
// 
// to run it:
// 1. delete the existing ./data.json
// 2. import in server.js and call the fn
//
// but keep in mind that refreshing the data will
// break all the tests!

import path from "path";
import fs from "fs/promises";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { LoremIpsum } from "lorem-ipsum";
const lorem = new LoremIpsum({
    wordsPerSentence: { min: 1, max: 16 },
    sentencesPerParagraph: { min: 1, max: 4 }
});

import db from "../db.js";
import img from "../img.js";
import isProd from "../isProd.js";


function printProgress(i, n) {
    if (i % Math.trunc(n / 10)) return;
    console.log(i + '/' + n);
}

function randomNormal(min = 0, max = 1, samples = 4) {
    let sum = 0;
    for (let i = 0; i < samples; i++) {
        sum += Math.random();
    }
    return min + (sum / samples) * (max - min);
}

function getDummyImage() {
    return new Blob(["dummy"], { type: "image/png" });
}


const url = "http://localhost:3000";

const dataSize = 100;
const maxUsers = dataSize;
const maxFollows = dataSize * 4;
const maxPosts = dataSize * 2;
const maxComments = dataSize * 4;
const maxLikes = dataSize * 4;


export default async () => {
    if (isProd) {
        console.log("error: can only generate data using dev db");
        return;
    }

    console.log("generating test data");

    console.log("generating users");

    let users = []
    for (let i = 0; i < maxUsers; i++) {
        const fName = lorem.generateWords(1);
        const lName = lorem.generateWords(1);

        const name = fName + '.' + lName;
        const pass = fName + "'s pass";
        
        const res = await fetch(url + "/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, pass })
        });
        const user = await res.json();
        if (res.status !== 200) {
            console.warn("failed to register user:", user);
            continue;
        }
        users.push(user);

        const formData = new FormData();
        formData.append("image", getDummyImage(), "test.png");
        formData.append("nick", lorem.generateWords(1));
        formData.append("bio", lorem.generateParagraphs(i % 2 ? 1 : 2));

        await fetch(url + "/api/users/profile", {
            method: "PUT",
            headers: { "Authorization": "Bearer " + user.accessToken },
            body: formData
        });

        printProgress(i, maxUsers);
    }

    console.log("done generating users");

    console.log("generating follows");

    for (let i = 0; i < maxFollows; i++) {
        const user1 = Math.trunc(randomNormal(0, users.length));
        const user2 = Math.trunc(randomNormal(0, users.length));

        const token = users[user1].accessToken;
        const following = users[user2].user.id;
        
        const res = await fetch(url + "/api/follows/" + following, {
            method: "PUT",
            headers: { "Authorization": "Bearer " + token },
        });

        if (res.status !== 201) {
            const reason = await res.json();
            console.log("failed to follow user:", reason);
        }

        printProgress(i, maxFollows);
    }

    console.log("done generating follows");

    console.log("generating posts");

    let posts = [];
    for (let i = 0; i < maxPosts; i++) {
        const author = Math.trunc(randomNormal(0, users.length));
        const token = users[author].accessToken;

        const formData = new FormData();
        formData.append("image", getDummyImage(), "test.png");
        formData.append("caption", lorem.generateSentences(i % 2 ? 1 : 2));

        const res = await fetch(url + "/api/posts", {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        });
        const post = await res.json();
        posts.push(post);
        
        printProgress(i, maxPosts);
    }

    console.log("done generating posts");

    console.log("generating comments");

    let replies = [];
    for (let i = 0; i < maxComments; i++) {
        const author = Math.trunc(randomNormal(0, users.length));
        const parent = Math.trunc(randomNormal(0, posts.length));

        const token = users[author].accessToken;
        const target = posts[parent]._id;

        const isReply = "parentType" in posts[parent];
        const parentType = isReply ? "comment" : "post";

        const text = lorem.generateSentences(i % 2 ? 1 : 2);

        const endpoint = `${url}/api/comments/${parentType}/${target}`;
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ text })
        });

        const comment = await res.json();
        (isReply ? replies : posts).push(comment);

        printProgress(i, maxComments);
    }
    posts.push(...replies);

    console.log("done generating comments");

    console.log("generating likes");

    for (let i = 0; i < maxLikes; i++) {
        const author = Math.trunc(randomNormal(0, users.length));
        const parent = Math.trunc(randomNormal(0, posts.length));

        const token = users[author].accessToken;
        const target = posts[parent]._id;

        const isComment = "parentType" in posts[parent];
        const parentType = isComment ? "comment" : "post";

        const endpoint = `${url}/api/likes/${parentType}/${target}`;
        await fetch(endpoint, {
            method: "PUT",
            headers: { "Authorization": "Bearer " + token }
        });
        
        printProgress(i, maxLikes);
    }

    console.log("done generating likes");

    console.log("all done");

    console.log("writing data to src/config/dev/testData.json");
    await fs.writeFile(path.join(__dirname, "data.json"), JSON.stringify({
        users: await db.users.find({}),
        tokens: await db.tokens.find({}),
        follows: await db.follows.find({}),
        posts: await db.posts.find({}),
        comments: await db.comments.find({}),
        likes: await db.likes.find({}),
        images: img.getImages()
    }, null, 2));
    console.log("done");
};

