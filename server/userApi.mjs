import crypto from "node:crypto";
import util from "node:util";
import validator from "validator";

import { userApi, pool, bindPromisify, ui, sendFileOptions }  from "./init.mjs";

userApi.post("/new-user", async (req, res) => {
    const client = await pool.connect();
    console.log(req.body);

    if (req.body === undefined) {
        res.status(400).end();
        return;
    }

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
            errors.email = "Email must be a string";
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
            res.status(201).setHeader("Location", "/" + username + "/c/"); // TODO: Set Location header
            res.end();
        }
    }
    finally {
        client.release();
    }
});

userApi.post("/login", async (req, res) => {
    const { name, password } = req.body;
    if (typeof name !== "string" || typeof password !== "string") {
        res.status(422).end();
        return;
    }
    const nameType = name.indexOf("@") === -1 ? "username" : "email";
    const client = await pool.connect();
    
    try {
        const user = (await client.query(`SELECT password, salt, user_id, username FROM users WHERE ${nameType} = $1`, [ name ])).rows[0];

        console.log(nameType);
        console.log(name);

        
        if (user === undefined) {
            res.status(404).end();
        }
        else if (crypto.timingSafeEqual(await util.promisify(crypto.scrypt)(password, user.salt, 32), Buffer.from(user.password))) {
            req.session.userId = user.user_id;
            res.status(200).json({
                username: user.username,
                characterList: `/${user.username}/c/`,
            });
        }
        else {
            res.status(401).end();
        }
    }
    finally {
        client.release();
    }
});

userApi.post("/logout", async (req, res) => {
    await bindPromisify(req.session, "destroy")();
    res.status(204).end();
});

userApi.delete("/current-user", async (req, res) => {
    const client = await pool.connect();
    try {
        const { password } = req.body;
        if (typeof password !== "string") {
            res.status(422).send("Deletion request must include password");
        }
        const { password: passwordHash, salt } = (await client.query(`SELECT password, salt FROM users WHERE user_id = $1`, [ req.session.userId ])).rows[0];

        if (crypto.timingSafeEqual(await util.promisify(crypto.scrypt)(password, salt, 32), Buffer.from(passwordHash))) {
            await Promise.all([
                client.query(`DELETE FROM users WHERE user_id = $1`, [ req.session.userId ]),
                client.query(`DELETE FROM sharing WHERE user = $1 OR character = (SELECT character_id FROM characters WHERE owner = $1)`, [ req.session.userId ]),
                client.query(`DELETE FROM characters WHERE owner = $1`, [ req.session.userId ])]);
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

ui.get("/login", async (req, res) => {
    if (req.session.userId) {
        const username = (await pool.query("SELECT username FROM users WHERE user_id = $1", [req.session.userId])).rows[0].username;
        res.redirect(303, req.parsedUrl.searchParams.get("returnTo") ?? `./${username}/c/`)
    }
    else {
        await res.status(200).sendFileAsync("./views/login.html", sendFileOptions);
    }
});

ui.get("/signup", async (req, res) => {
    if (req.session.userId) {
        const username = (await pool.query("SELECT username FROM users WHERE user_id = $1", [req.session.userId])).rows[0].username;
        res.redirect(303, req.parsedUrl.searchParams.get("returnTo") ?? `./${username}/c/`)
    }
    else {
        await res.status(200).sendFileAsync("./views/signup.html", sendFileOptions);
    }
})