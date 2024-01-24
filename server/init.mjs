import express from "express";
import session from "express-session";
import pgConnect from "connect-pg-simple";
import util from "node:util";
import process from "node:process";
import pg from "pg";

export const app = express();
const testPoolConfig = {
    user: "liamr",
    host: "localhost",
    database: "dnd5e",
    port: "5432",
    ssl: false
};
const prodPoolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: true,
}
export const sendFileOptions = { root: process.cwd() };

export const pool = new pg.Pool(app.get("env") === "production" ? prodPoolConfig : testPoolConfig);
const PGSession = pgConnect(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false,
        sameSite: "strict",
        secure: app.get("env") === "production",
    },
    store: new PGSession({ 
        pool, 
        createTableIfMissing: true, 
    }),
    saveUninitialized: false,
    secret: process.env.SECRET ?? "L6WpMp3EJLroE9YtzXLoYr5pU2enJSSj",
    resave: false,
}));

export function bindPromisify(obj, func) {
    return util.promisify(obj[func].bind(obj));
}

app.use((req, res, next) => {
    req.parsedUrl = new URL(`${req.protocol}://${req.headers.host}${req.originalUrl}`);
    res.sendFileAsync = bindPromisify(res, "sendFile");
    next();
});

export const userApi = express.Router();
export const characterApi = express.Router();
export const ui = express.Router();

app.use("/api/user", userApi);
app.use("/api/character", characterApi);
app.use(ui);