import "./characterApi.mjs";
import "./userApi.mjs";
import "./ui.mjs";
import process from "node:process";

import { app } from "./init.mjs";

const port = process.env.PORT ?? 8080;

app.listen(port, () => {
    console.log("Listening on port " + port);
});