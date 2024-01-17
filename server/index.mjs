import "./characterApi.mjs";
import "./userApi.mjs";
import "./ui.mjs";

import { app, port } from "./init.mjs";

app.listen(port, () => {
    console.log("Listening on port " + port);
});