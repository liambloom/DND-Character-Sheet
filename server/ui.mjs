import { ui, sendFileOptions } from "./init.mjs";

ui.get("/", async (req, res) => {
    res.sendFileAsync("./views/index.html", sendFileOptions);
});

ui.get(/\./, async (req, res) => {
    try {
        await res.status(200).sendFileAsync("." + req.parsedUrl.pathname, sendFileOptions);
    }
    catch (err) {
        res.sendStatus(404);
    }
});