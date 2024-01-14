const express = require("express");
const session = require("express-session");
const PGSession = require("connect-pg-simple")(session);
const mime = require("mime-types");
const fs = require("node:fs/promises");
const url = require("node:url");
const crypto = require("node:crypto");
const util = require("node:util");
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

const pool = new Pool(testConfig);

function getURL(req) {
    return url.parse(`${req.protocol}://${req.get("host")}${req.originalUrl}`, true)
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false,
        sameSite: "strict",
    },
    store: new PGSession({ pool }),
    secret: "L6WpMp3EJLroE9YtzXLoYr5pU2enJSSj",
    resave: false,
}));

// https://expressjs.com/en/resources/middleware/session.html
// https://www.npmjs.com/package/connect-pg-simple
// https://levelup.gitconnected.com/expressjs-postgresql-session-store-ec987146f706

app.post("/api/new-user", async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { username, displayName, email, password } = req.body;

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
        else if (await client.query("SELECT FROM users WHERE username = $1 LIMIT 1", [username])) {
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
        else if (validator.isEmail(email)) {
            errors.email = "Invalid email";
        }
        else if (await client.query("SELECT FROM users WHERE email = $1 LIMIT 1", [email])) {
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
            res.writeHead(duplicateError ? 422 : 409, { "Content-Type": "application/json" });
            res.write(JSON.stringify(errors));
        }
        else {
            const userId = crypto.randomUUID();
            const salt = crypto.randomBytes(16);
            const hash = await util.promisify(crypto.scrypt)(password, salt, 32);

            await client.query(`INSERT INTO users (user_id, username, email, display_name, password, salt, created)
                VALUES ($1, $2, $3, $4, $5, $6, current_timestamp)`, [userId, username, displayName, email, hash, salt]);

            // login 201
        }
    }
    catch {
        console.error(err);
        res.writeHead(500)
    }
    finally {
        res.end();
        client.release();
    }
});

app.post("/api/login", async (req, res) => {
    const { name, password } = req.body;
    const nameType = name.indexOf("@") === -1 ? "username" : "email";
    const client = await pool.connect();
    
    try {
        const user = await client.query(`SELECT password, salt, user_id WHERE ${nameType} = $1`, name);
        
        if (user.rowCount === 0) {
            res.writeHead(401);
        }
        if (crypto.timingSafeEqual(await util.promisify(crypto.scrypt)(password, user.salt, 32), user.password)) {
            // login 204
        }
        else {
            res.writeHead(403);
        }
    }
    catch {
        console.error(err);
        res.writeHead(500)
    }
    finally {
        res.end();
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
})
app.get("/:username/c/:character", async (req, res) => {
    try {
        await fs.access("characters/" + req.params.character + ".json", fs.constants.F_OK)
        const data = await fs.readFile("./views/character.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
    }
    catch (error1) {
        try {
            const p404 = await fs.readFile("./views/404.html");
            res.writeHead(404, { "Content-Type": "text/html" });
            res.write(p404);
        }
        catch (error2) {
            console.error(error1);
            console.error(error2);
            res.writeHead(500)
        }
    }
    finally {
        res.end();
    }
});
app.get(/\./, async (req, res) => {
    const path = getURL(req);
    const page = "." + path.pathname;
    const type = page.match(/(?<=\.)[^.\/]+$/)[0];

    try {
        const data = await fs.readFile(page);
        res.writeHead(200, { "Content-Type": mime.contentType(type) });
        res.write(data);
    }
    catch (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.write(`The page ${path.href} could not be found<br>${err}`);
    }
    finally {
        res.end();
    }
});
app.put(/characters\/.*.json/, async (req, res) => {
    try {
        await fs.writeFile("." + getURL(req).pathname, JSON.stringify(req.body));
        res.writeHead(204);
    }
    catch (err) {
        console.error(err);
        res.writeHead(500);
    }
    finally {
        res.end();
    }
});

app.listen(port, () => {
    console.log("Listening on port " + port);
});