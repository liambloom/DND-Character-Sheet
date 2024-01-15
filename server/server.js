const express = require("express");
const session = require("express-session");
const PGSession = require("connect-pg-simple")(session);
const fs = require("node:fs/promises");
const url = require("node:url");
const crypto = require("node:crypto");
const util = require("node:util");
const process = require("node:process");
const http = require("node:http");
const validator = require("validator");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 8080;
const testConfig = {
    user: "liamr",
    host: "localhost",
    database: "dnd5e",
    port: "5432",
    ssl: false
};
const sendFileOptions = { root: process.cwd() };
const blankCharacter = JSON.parse(await fs.readFile("./blank-character.json"));

const pool = new Pool(testConfig);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false,
        sameSite: "strict",
    },
    store: new PGSession({ 
        pool, 
        createTableIfMissing: true, 
    }),
    saveUninitialized: false,
    secret: "L6WpMp3EJLroE9YtzXLoYr5pU2enJSSj",
    resave: false,
}));

function bindPromisify(obj, func) {
    return util.promisify(obj[func].bind(obj));
}

app.use((req, res, next) => {
    req.parsedUrl = url.parse(`${req.protocol}://${req.headers.host}${req.originalUrl}`, true);
    res.sendFileAsync = bindPromisify(res, "sendFile");
    next();
});

app.post("/api/new-user", async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { username, displayName, email, password } = req.body;

        console.log(req.body);

        const errors = {};
        let duplicateError = false;
        if (typeof username !== "string") {
            errors.username = "Username must be a string";
        }
        else if (username.length < 1) {
            errors.username = "Username cannot be blank";
        }
        else if (username.length > 50) {
            errors.username = "Username cannot be more than 50 characters long";
        }
        else if (/[^A-Za-z0-9_\-.]/.test(username)) {
            errors.username = "Username can only contain characters letters, numbers, _, -, and ."
        }
        else if ((await client.query("SELECT FROM users WHERE username = $1 LIMIT 1", [username])).rowCount !== 0) {
            duplicateError = true;
            errors.username = "Taken";
        }

        if (typeof displayName !== "string") {
            errors.displayName = "Display name must be a string";
        }
        else if (displayName.length < 1) {
            errors.displayName = "Display name cannot be blank";
        }
        else if (displayName.length > 80) {
            errors.displayName = "Display name cannot be more than 50 characters long";
        }

        if (typeof email !== "string") {
            errors.username = "Email must be a string";
        }
        else if (email.length < 1) {
            errors.email = "Email cannot be blank";
        }
        else if (email.length > 50) {
            errors.email = "Email cannot be more than 50 characters long";
        }
        else if (!validator.isEmail(email)) {
            errors.email = "Invalid email";
        }
        else if ((await client.query("SELECT FROM users WHERE email = $1 LIMIT 1", [email])).rowCount !== 0) {
            duplicateError = true;
            errors.email = "Taken";
        }

        let matches;
        if (typeof password !== "string") {
            errors.password = "Password must be a string";
        }
        else if (password.length < 1) {
            errors.password = "Password cannot be blank";
        }
        else if (password.length > 50) {
            errors.password = "Password cannot be more than 50 characters long";
        }
        else if (matches = password.match(/[^\x21-\x7e]/)) {
            errors.password = "Password cannot contain " + [...Set(matches)].join(", ");
        }

        if (Object.keys(errors).length > 0) {
            res.status(duplicateError ? 409 : 422).json(errors);
        }
        else {
            const userId = crypto.randomUUID();
            const salt = crypto.randomBytes(16);
            const hash = await util.promisify(crypto.scrypt)(password, salt, 32);

            console.log([userId, username, displayName, email, hash, salt]);
            console.log(hash.length);
            await client.query(`INSERT INTO users (user_id, username, email, display_name, password, salt, created)
                VALUES ($1, $2, $3, $4, $5, $6, current_timestamp)`, [userId, username, email, displayName, hash, salt]);

            req.session.userId = userId;
            res.status(204).end();
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).end();
    }
    finally {
        client.release();
    }
});

app.post("/api/login", async (req, res) => {
    const { name, password } = req.body;
    if (typeof name !== "string" || typeof password !== "string") {
        res.status(422).end();
        return;
    }
    const nameType = name.indexOf("@") === -1 ? "username" : "email";
    const client = await pool.connect();
    
    try {
        const user = (await client.query(`SELECT password, salt, user_id FROM users WHERE ${nameType} = $1`, [ name ])).rows[0];

        console.log(nameType);
        console.log(name);

        console.log(await util.promisify(crypto.scrypt)(password, user.salt, 32));
        console.log(Buffer.from(user.password));
        
        if (user === undefined) {
            res.status(404);
        }
        else if (crypto.timingSafeEqual(await util.promisify(crypto.scrypt)(password, user.salt, 32), Buffer.from(user.password))) {
            req.session.userId = user.user_id;
            res.status(204);
        }
        else {
            res.status(401);
        }
    }
    catch (err) {
        console.error(err);
        res.status(500)
    }
    finally {
        res.end();
        client.release();
    }
});

app.post("/api/logout", async (req, res) => {
    try {
        await bindPromisify(req.session, "destroy")();
        res.status(204).end();
    }
    catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

app.delete("/api/user", async (req, res) => {
    const client = await pool.connect();
    try {
        const { password } = req.body;
        if (typeof password !== "string") {
            res.status(422).send("Deletion request must include password");
        }
        const { password: passwordHash, salt } = (await client.query(`SELECT password, salt FROM users WHERE user_id = $1`, [ req.session.userId ])).rows[0];

        if (crypto.timingSafeEqual(await util.promisify(crypto.scrypt)(password, salt, 32), Buffer.from(passwordHash))) {
            await client.query(`
                DELETE FROM users WHERE user_id = $1;
                DELETE FROM sharing WHERE user = $1 OR character = (SELECT character_id FROM characters WHERE owner = $1);
                DELETE FROM characters WHERE owner = $1;
            `, [ req.session.userId ]);
            await bindPromisify(req.session, "destroy")();
            res.status(204).end();
        }
        else {
            res.status(401).end();
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).end();
    }
    finally {
        client.release();
    }
});

app.get("/", async (req, res) => {
    try {
        const data = await fs.readFile("./views/index.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
    }
    catch (err) {
        console.error(err);
        res.writeHead(500)
    }
    finally {
        res.end();
    }
});

const ShareLevel = {
    "none": 0,
    "view": 1,
    "edit": 2,
}

async function getCharacter(sessionUser, owner, title, characterColumns = "1", sharingColumns = "1") {
    /* `SELECT ${["character.sharing", "sharing.share_level", ...columns].join(",")} FROM characters, sharing 
        WHERE character.owner = $1 AND character.title = $2 AND (character.owner = $3 OR character.share_level > 'none' 
            OR (sharing.character = character.character_id AND sharing.user = $3 AND sharing.share_level > 'none'))` */

    const client = await pool.connect();

    try {
        let characterQueryResult = await client.query(`SELECT ${["character_id", "share_level", ...characterColumns].join(",")} FROM characters WHERE owner = $1 AND title = $2`, [owner, title]);

        if (characterQueryResult.rowCount === 0) {
            return { status: 404, characterData: null, sharingData: null, shareLevel: null };
        }

        const characterData = characterQueryResult.rows[0];
        let sharingData;

        const sharingArgs = [characterData.character_id, sessionUser, characterData.share_level];
        let thisShareLevel = characterData.share_level;

        if (sessionUser !== null && ShareLevel[character.share_level] > ShareLevel.none) {
            await client.query(`UPDATE sharing SET share_level = $3 WHERE character = $1 AND user = $2 AND share_level < $3`, sharingArgs);
            sharingData = await client.query(`SELECT ${["share_level", ...sharingColumns].join(",")} FROM sharing WHERE character = $1 AND user = $2`, sharingArgs);

            thisShareLevel = sharingData.share_level;

            if (sharingData.rowCount === 0) {
                sharingData = await client.query(`INSERT INTO sharing (character, "user", share_level) VALUES ($1, $2, $3) RETURNING ${sharingColumns.join(",")}`);
                canShare = true;
            }
        }



        if (ShareLevel(thisShareLevel) >= ShareLevel.none) {
            return { 
                status: 200, 
                characterData: Object.fromEntries(characterColumns.map(c => [c, characterData[c]])),
                sharingData: Object.fromEntries(sharingColumns.map(c => [c, sharingData[c]])),
                shareLevel: thisShareLevel,
            };
        }
        else {
            return { status: 401, characterData: null, sharingData: null, shareLevel: null };
        }
    }
    catch (err) {
        console.error(err);
        return { status: 500, characterData: null, sharingData: null, shareLevel: null };
    }
    finally {
        client.release();
    }
}
app.get("/:username/c/:character", async (req, res) => {
    try {
        const character = getCharacter(req.session.userId, req.params.username, req.params.character);
        res.status(character.status);
        switch (character.status) {
            case 200:
                await res.sendFileAsync("./views/character.html", sendFileOptions);
                break;
            case 404:
                await res.sendFileAsync("./views/404.html", sendFileOptions);
                break;
            default:
                res.sendStatus(character.status);
        }
    }
    catch (err) {
        console.error(err);
        res.sendStatus(500)
    }
});
app.get("/data/:username/c/:character", async (req, res) => {
    try {
        const { status, characterData, shareLevel} = getCharacter(req.session.userId, req.params.username, req.params.character, "content");
        res.status(status);
        switch (status) {
            case 200:
                res.json(characterData.content);
                break;
            default:
                res.end();
        }
    }
    catch (err) {
        console.error(err);
        res.sendStatus(500)
    }
});

// app.put(/characters\/.*.json/, async (req, res) => {
//     try {
//         await fs.writeFile("." + req.parsedUrl.pathname, JSON.stringify(req.body));
//         res.status(204).end();
//     }
//     catch (err) {
//         console.error(err);
//         res.status(500).end();
//     }
// });

app.get(/\./, async (req, res) => {
    try {
        await res.status(200).sendFileAsync("." + req.parsedUrl.pathname, sendFileOptions);
    }
    catch (err) {
        res.sendStatus(404);
    }
});

app.listen(port, () => {
    console.log("Listening on port " + port);
});