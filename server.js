const express = require("express");
const mime = require("mime-types");
const fs = require("fs/promises");
const url = require("url");

const app = express();
const port = process.env.PORT || 8080;

function getURL(req) {
    return url.parse(`${req.protocol}://${req.get("host")}${req.originalUrl}`, true)
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(/^[^\.]+$/, async (req, res) => {
    try {
        await fs.access("characters/" + getURL(req).pathname.split("/").pop() + ".json", fs.constants.F_OK)
        const data = await fs.readFile("./index.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
    }
    catch (error1) {
        try {
            const p404 = await fs.readFile("./404.html");
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
app.post(/characters\/.*.json/, async (req, res) => {
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