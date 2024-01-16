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

app.post("/api/user/new-user", async (req, res) => {
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
            res.status(201).end(); // TODO: Set Location header
        }
    }
    finally {
        client.release();
    }
});

app.post("/api/user/login", async (req, res) => {
    const { name, password } = req.body;
    if (typeof name !== "string" || typeof password !== "string") {
        res.status(422);
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
    finally {
        client.release();
    }
});

app.post("/api/user/logout", async (req, res) => {
    await bindPromisify(req.session, "destroy")();
    res.status(204).end();
});

app.delete("/api/user/current-user", async (req, res) => {
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
    finally {
        client.release();
    }
});

app.get("/", async (req, res) => {
    res.sendFileAsync("./views/index.html", sendFileOptions);
});

const ShareLevel = new Map();
ShareLevel.none = 0;
ShareLevel.view = 1;
ShareLevel.edit = 2;

ShareLevel.set("none", ShareLevel.none)
ShareLevel.set("view", ShareLevel.view);
ShareLevel.set("edit", ShareLevel.edit);

ShareLevel.MAX = ShareLevel.edit;

const CaseChanger = {
    change(str) {
        let words = str.split(/_|(?=[A-Z])/g).map(s => s.toLowerCase());
        if (words[0]?.length === 0) {
            words.splice(0, 1);
        }

        return {
            toSnakeCase: () => words.join("_"),
            toCamelCase: () => words.length ? words[0] + words.slice(1).map(s => s && (s.charAt(0).toUpperCase() + s.substring(1))) : "",
            toCapitalCase: () => words.map(s => s && (s.charAt(0).toUpperCase() + s.substring(1))),
        }
    }
}

class Character {
    constructor(sessionUser, characterId, owner, title, linkSharing, content) {
        this.sessionUser = sessionUser;
        this.characterId = characterId;

        for (let [ column, value ] of Object.entries({ owner, title, linkSharing, content })) {
            const colCapital = CaseChanger.change(column).toCapitalCase();

            this[column + "Value"] = value;
            this["get" + colCapital] = this.getColumnValue.bind(this, column);
            this["set" + colCapital] = this.setColumnValue.bind(this, column);
        }
    }

    getColumnValue(column) {
        return this[CaseChanger.change(column).toCamelCase() + "Value"];
    }

    async setColumnValue(column, value) {
        const colCaseChanger = CaseChanger.change(column);
        this[colCaseChanger.toCamelCase() + "Value"] = value;
        await pool.query(`UPDATE characters SET ${colCaseChanger.toSnakeCase()} = $1 WHERE character_id = $2`, [value, this.characterId]);
    }

    columnExists(column) {
        return ["character_id", "owner", "title", "link_sharing", "content"].indexOf(CaseChanger.change(column).toSnakeCase()) >= 0;
    }

    getLinkShareLevel() {
        return ShareLevel.get(this.getLinkSharing);
    }

    async getUserDirectSharing() {
        if (this.sessionUser == undefined) {
            return "none";
        }

        this.userDirectSharingValue ??= await pool.query(`SELECT share_type FROM sharing WHERE character = $1 AND user = $2`, [this.characterId, this.sessionUser]);

        if (this.userDirectSharingValue.rowCount === 0) {
            return "none";
        }
        else {
            return this.userDirectSharingValue.rows[0].share_type;
        }
    }


    async getUserDirectSharingLevel() {
        return ShareLevel.get(await this.getUserDirectSharing())
    }

    async shareLevelGE(target) {
        return this.currentUserIsOwner() || this.getLinkShareLevel() >= target || await this.getUserDirectSharingLevel() >= target;
    }

    async canView() {
        return await this.shareLevelGE(ShareLevel.view);
    }

    async canEdit() {
        return await this.shareLevelGE(ShareLevel.edit);
    }

    currentUserIsOwner() {
        return sessionUser === this.getOwner();
    }

    async deleteCharacter() {
        await pool.query(`
            DELETE FROM characters WHERE character_id = $1;
            DELETE FROM sharing WHERE character = $1;
        `, [characterId]);
    }

    static async getBlankCharacterSheet() {
        return this.blankCharacterSheet ??= JSON.parse(await fs.readFile("./blank-character.json"));
    }

    static async createCharacter(creatorId, title, content) {
        const characterId = crypto.randomUUID();

        await pool.query(`INSERT INTO characters (character_id, owner, title, link_sharing, content) VALUES ($1, $2, $3, 'none', $4)`, 
            [characterId, creatorId, title, content]);

        return new Character(creatorId, characterId, creatorId, title, 'none', content);
    }

    static async getCharacter(sessionUser, owner, title) {
        const data = await pool.query(`SELECT * FROM characters WHERE owner = (SELECT user_id FROM users WHERE username = $1) AND title = $2`, [owner, title]);

        if (data.rowCount === 0) {
            return null;
        }
        else {
            const { characterId, owner, title, linkSharing, content } = data.rows[0];
            return new Character(sessionUser, characterId, owner, title, linkSharing, content);
        }
    }

    static async getPropertyError(property, value, character) {
        switch (property) {
            case "title":
                if (typeof value !== "string") {
                    return { status: 422, content: { error: "Title must be a string", target: "value" } };
                }
                else if (value.length < 1) {
                    return { status: 422, content: { error: "Title cannot be blank", target: "value" } };
                }
                else if (value.length > 80) {
                    return { status: 422, content: { error: "Title cannot be more than 50 characters long", target: "value" } };
                }
                else if (/[^A-Za-z0-9_\-.]/.test(value)) {
                    return { status: 422, content: { error: "Title can only contain characters letters, numbers, _, -, and .", target: "value" } };
                }
                else if (Character.getCharacter(req.session.userId, req.params.username, value) !== null) {
                    return { status: 409, content: { error: "Character with this title already exists", target: "value" } };
                }
                else {
                    return null;
                }
            case "owner":
                if (!character.currentUserIsOwner()) {
                    return { status: 401, content: { error: "Only the character owner can transfer ownership", target: "user" } };
                }
                else {
                    const newOwnerQuery = await pool.query("SELECT user_id FROM users WHERE username = $1", [ value ]);

                    if (newOwnerQuery.rowCount === 0) {
                        return { status: 404, content: { error: "New owner does not exist", target: "value" } };
                    }
                    else {
                        const originalOwner = character.getOwner();
                        const newOwner = newOwnerQuery.rows[0].user_id;

                        if (originalOwner === newOwner) {
                            return { status: 422, content: { error: "New and current owner are the same", target: "value" } };
                        }
                        else {
                            return null;
                        }
                    }
                }
            case "linkSharing":
                if (typeof value !== "string" || !ShareLevel.has(value)) {
                    return { status: 422, content: { error: "Link sharing must be one of 'none', 'view' or 'edit'.", target: "value" } };
                }
                else {
                    return null;
                }
            case "content":
                if (typeof value !== object) {
                    return { status: 422, content: { error: "Character content must be object ", target: "value" } };
                }
                else {
                    const contentStr = JSON.stringify(value);
                    if (Buffer.byteLength(contentStr) > 1e8) {
                        return { status: 413, content: { error: "Character content is too large (>100 MB)", target: "value" } };
                    }
                    else {
                        return null;
                    }
                }
            default:
                return { status: 422, content: { error: "Property does not exist", target: "property" } }
        }
    }
}

app.get("/:username/c/:character", async (req, res) => {
    const character = await Character.getCharacter(req.session.userId, req.params.username, req.params.character);

    if (character === null) {
        await res.status(404).sendFileAsync("./views/404.html", sendFileOptions);
    }
    else if (!character.canView()) {
        res.sendStatus(401);
    }
    else {
        await res.status(200).sendFileAsync("./views/character.html", sendFileOptions);
    }
});
app.get("/api/character/:username/:character", async (req, res) => {
    const character = await Character.getCharacter(req.session.userId, req.params.username, req.params.character);

    if (character === null) {
        res.sendStatus(404);
    }
    else if (!character.canView()) {
        res.sendStatus(401);
    }
    else {
        res.status(200).json({
            editPermission: character.canEdit(),
            content: character.getContent(),
        });
    }
});

app.put("/data/character/:username/:character", async (req, res) => {
    const character = await Character.getCharacter(req.session.userId, req.params.username, req.params.character);
    
    if (character === null) {
        res.status(404).json({ error: "Character does not exist", target: "character" });
    }
    else if (!character.canEdit()) {
        res.sendStatus(401).json({ error: "No edit permission", target: "user" });
    }
    else {
        const { property, value } = req.body;
        const error = await Character.getPropertyError(property, value, character);

        if (error !== null) {
            res.status(error.status).json(error.content);
        }
        else {
            const promises = [ character.setColumnValue(property, value) ];

            if (property === "owner") {
                promises.push(
                    pool.query(`
                        DELETE FROM sharing WHERE character = $1 AND user = $2;
                        INSERT INTO sharing (character, user, share_type) VALUES ($1, $3, 'edit'); 
                    `, [ character.characterId, originalOwner, newOwner])
                );
            }

            await Promise.all(promises);

            res.status(204);
        }
    }
});

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