import fs from "node:fs/promises";
import crypto from "node:crypto";

import { characterApi, ui, pool, sendFileOptions } from "./init.mjs";

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

    directSharingIds = new Map();

    async getUserDirectSharing(userId) {
        if (this.directSharingIds.has(userId)) {
            return this.directSharingIds.get(userId);
        }
        else if (this.directSharingIsComplete) {
            return "none";
        }
        else {
            const result = await pool.query(`SELECT share_type FROM sharing WHERE character = $1 AND user = $2`, [this.characterId, userId]);
            const value = result.rowCount === 0 ? "none" : result.rows[0].share_type;
            this.directSharingIds.set(userId, value);
            return value;
        }
    }

    async getUserDirectSharingLevel(user) {
        return ShareLevel.get(await this.getUserDirectSharing(user));
    }

    async setUserDirectSharing(user, value, userIsUsername) {
        delete this.directSharingUsernames;

        const userIdSql = userIsUsername ? "$2" : "(SELECT user_id FROM users WHERE username = $2)";
        if (value === "none") {
            const userId = await pool.query(`DELETE FROM sharing WHERE character = $1 AND user = ${userIdSql} RETURNING user`, [this.characterId, user]);
            if (userId.rowCount === 0) {
                return false;
            }
            else {
                this.directSharingIds.delete(userId);
                return true;
            }
        }
        else {
            const userId = await pool.query(`INSERT INTO sharing (character, user, share_type) VALUES ($1, ${userIdSql}, $3) 
                ON CONFLICT DO UPDATE sharing SET share_type = $3 WHERE character = $1 AND user = ${userIdSql} RETURNING user`, [this.characterId, user, value]);
            if (userId.rowCount === 0) {
                return false;
            }
            else {
                this.directSharingIds.set(userId, value);
                return true;
            }
        }
    }

    async getAllDirectSharing() {
        if (this.directSharingUsernames) {
            return this.directSharingUsernames;
        }
        else {
            this.directSharingUsernames = await pool.query(`SELECT user.username, user.display_name, sharing.share_type FROM users, sharing 
                WHERE sharing.character = $1 AND sharing.user = users.user_id`, 
                [this.characterId]).rows;
        }
    }

    async getCurrentUserDirectSharing() {
        return this.sessionUser === undefined ? "none" : await this.getUserDirectSharing(this.sessionUser);
    }

    async getCurrentUserDirectSharingLevel() {
        return ShareLevel.get(await this.getCurrentUserDirectSharing())
    }

    async shareLevelGE(target) {
        return this.currentUserIsOwner() || this.getLinkShareLevel() >= target || await this.getCurrentUserDirectSharingLevel() >= target;
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

    static async createCharacter(creatorId, title, linkSharing, content) {
        const characterId = crypto.randomUUID();

        await pool.query(`INSERT INTO characters (character_id, owner, title, link_sharing, content) VALUES ($1, $2, $3, $4, $5)`, 
            [characterId, creatorId, title, linkSharing, content]);

        return new Character(creatorId, characterId, creatorId, title, linkSharing, content);
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
                    return { status: 403, content: { error: "Only the character owner can transfer ownership", target: "user" } };
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

characterApi.get("/:username/:character", async (req, res) => {
    const character = await Character.getCharacter(req.session.userId, req.params.username, req.params.character);

    if (character === null) {
        res.status(404).json({ error: "Character does not exist", target: "character" });
    }
    else if (!character.canView()) {
        res.status("userId" in req.session ? 403 : 401).json({ error: "No view permission", target: "user" });
    }
    else {
        res.status(200).json({
            editPermission: character.canEdit(),
            content: character.getContent(),
        });
    }
});

characterApi.put("/:username/:character", async (req, res) => {
    const character = await Character.getCharacter(req.session.userId, req.params.username, req.params.character);
    
    if (character === null) {
        res.status(404).json({ error: "Character does not exist", target: "character" });
    }
    else if (!character.canEdit()) {
        res.status("userId" in req.session ? 403 : 401).json({ error: "No edit permission", target: "user" });
    }
    else {
        let { property, value } = req.body;
        const error = await Character.getPropertyError(property, value, character);

        if (error !== null) {
            res.status(error.status).json(error.content);
        }
        else {
            const promises = [];

            if (property === "owner") {
                const newOwnerQuery = await pool.query(`SELECT user_id FROM users WHERE username = $1`, [ value ]);

                if (newOwnerQuery.rowCount === 0) {
                    res.status(404).json({ error: "New owner does not exist", target: "value" });
                }
                else {
                    value = newOwnerQuery.rows[0].user_id;
                    promises.push(
                        character.setUserDirectSharing(character.getOwner(), "edit"),
                        character.setUserDirectSharing(value, "none"),
                    );
                }
            }

            promises.push(character.setColumnValue(property, value));

            await Promise.all(promises);

            res.status(204).end();
        }
    }
});

characterApi.delete("/:username/:character", async (req, res) => {
    const character = await Character.getCharacter(req.session.userId, req.params.username, req.params.character);

    if (character === null) {
        res.status(404).json({ error: "Character does not exist", target: "character" });
    }
    else if (!character.currentUserIsOwner()) {
        res.status("userId" in req.session ? 403 : 401).json({ error: "Only owner can delete character", target: "user" });
    }
    else {
        await character.deleteCharacter();
        res.status(204).end();
    }
});

characterApi.get("/:username/:character/sharing", async (req, res) => {
    const character = await Character.getCharacter(req.session.userId, req.params.username, req.params.character);

    if (character === null) {
        res.status(404).json({ error: "Character does not exist", target: "character" });
    }
    else if (!character.canView()) {
        res.status("userId" in req.session ? 403 : 401).json({ error: "No view permission", target: "user" });
    }
    else {
        const data = await character.getAllDirectSharing();
        res.status(200).json(data);
    }
});

characterApi.post("/:username/:character/sharing", async (req, res) => {
    const character = await Character.getCharacter(req.session.userId, req.params.username, req.params.character);

    if (character === null) {
        res.status(404).json({ error: "Character does not exist", target: "character" });
    }
    else if (!character.canEdit()) {
        res.status("userId" in req.session ? 403 : 401).json({ error: "No edit permission", target: "user" });
    }
    else {
        const exist = [];
        const notExist = [];

        for (let { user, level } of req.body) {
            if (character.setUserDirectSharing(user, level, true)) {
                notExist.push(user);
            }
            else {
                exist.push(user);
            }
        }

        if (notExist.length) {
            const responses = [];

            for (let user of exist) {
                responses.push({ user, status: 204 });
            }

            for (let user of notExist) {
                responses.push({ user, status: 404, error: "User does not exist", target: "value" });
            }

            res.status(207).json(responses);
        }

        res.status(204).end();
    }
});

characterApi.post("/new", async (req, res) => {
    if (!("userId" in req.session)) {
        res.status(401).json({ error: "Not logged in", target: "user" });
    }
    else {
        const errors = Object.fromEntries([ "title", "linkSharing", "content" ]
            .map(column => [column, req.body[column]])
            .filter(([, value]) => value != null)
            .map(Character.getPropertyError))
        await Promise.all(Object.values(errors));
        
        let error = false;
        
        for (let key in errors) {
            const value = await errors[key];
            if (value === null) {
                delete errors[key];
            }
            else {
                error = true;
                errors[key] = value;
            }
        }

        if (error) {
            res.status(errors.length === 1 ? errors[0].status : 422).json(errors);
        }
        else {
            await Character.createCharacter(req.session.userId, req.body.title, req.body.linkSharing ?? 'none', req.body.content ?? await Character.getBlankCharacterSheet());

            res.status(201).end();
        }
    }
});

characterApi.get("myCharacterList", async (req, res) => {
    if (!("userId" in req.session)) {
        res.status(401).json({ total: { error: "Not logged in" }, target: "user" });
    }
    else {
        const characters = await pool.query(`SELECT title FROM characters WHERE owner = $1`, [ req.session.userId ]);

        res.status(200).json(characters.rows);
    }
});

ui.get("/:username/c/", async (req, res) => {
    if (!("userId" in req.session)) {
        res.redirect(303, "/login?returnTo=" + req.parsedUrl);
    }
    else {
        await res.status(200).sendFileAsync("./views/characterList.html", sendFileOptions)
    }
});

ui.get("/:username/c/:character", async (req, res) => {
    const character = await Character.getCharacter(req.session.userId, req.params.username, req.params.character);

    if (character === null) {
        await res.status(404).sendFileAsync("./views/404.html", sendFileOptions);
    }
    else if (!character.canView()) {
        if ("userId" in req.session) {
            res.sendStatus(403);
        }
        else {
            res.redirect(303, "/login?returnTo=" + req.parsedUrl);
        }
    }
    else {
        await res.status(200).sendFileAsync("./views/character.html", sendFileOptions);
    }
});