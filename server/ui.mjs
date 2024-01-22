import { ui, sendFileOptions } from "./init.mjs";

ui.get("/", async (req, res) => {
    await res.sendFileAsync("./views/index.html", sendFileOptions);
});

ui.get(/^\/static\//, async (req, res) => {
    try {
        await res.status(200).sendFileAsync("." + req.parsedUrl.pathname, sendFileOptions);
    }
    catch (err) {
        res.sendStatus(404);
    }
});

ui.get("/favicon.ico", async (req, res) => {
    await res.sendFileAsync("./static/img/favicon/favicon.ico", sendFileOptions);
});