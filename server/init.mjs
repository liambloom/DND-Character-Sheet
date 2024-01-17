import express from "express";
import session from "express-session";
import pgConnect from "connect-pg-simple";
import url from "node:url";
import util from "node:util";
import process from "node:process";
import pg from "pg";

export const app = express();
export const port = process.env.PORT || 8080;
const testConfig = {
    user: "liamr",
    host: "localhost",
    database: "dnd5e",
    port: "5432",
    ssl: false
};
export const sendFileOptions = { root: process.cwd() };

export const pool = new pg.Pool(testConfig);
const PGSession = pgConnect(session);

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

export function bindPromisify(obj, func) {
    return util.promisify(obj[func].bind(obj));
}

app.use((req, res, next) => {
    req.parsedUrl = url.parse(`${req.protocol}://${req.headers.host}${req.originalUrl}`, true);
    res.sendFileAsync = bindPromisify(res, "sendFile");
    next();
});

export const userApi = express.Router();
export const characterApi = express.Router();
export const ui = express.Router();

app.use("/api/user", userApi);
app.use("/api/character", characterApi);
app.use(ui);