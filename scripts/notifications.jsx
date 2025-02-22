import React from "./jsx.js";

const KOFI_NOTIF_ID = "1401a2b3-1366-4f64-bd0a-98451409ee1d";
const notifsPromise = fetch("/api/user/notifications");
const isCharacterSheet = /\/[^\/]+\/c\/[^\/]+/.test(new URL(location.href).pathname);

const kofiNotif = <div class="bottomNotif">
    <div id="kofi-text">
        Hi! I pay about $10/month, or $120/year, for the servers, database, and domain needed to host this site. If
        you find the site useful and want to help support me in continuing to provide this site, consider donating
        to me on Ko-fi!
    </div>

    <a id="kofi-link" target="_blank" href="https://donations.liambloom.dev" class="bottom-button-min">
        <img id="kofi-button" class="bottom-button-min" src="/static/img/kofi/support_me_on_kofi_red.png" alt="Support me on Kofi"></img>
    </a>

    <input id="kofi-dismiss" type="button" value="Dismiss" />
</div>

let initialCharacterButtons;

const initialBodyBottom = parseInt(getComputedStyle(document.body).marginBottom);

function adjustScroll() {
    console.log("foo");
    console.log(kofiNotif.clientHeight, getComputedStyle(document.body).marginBottom);
    document.body.style.setProperty("margin-bottom", `${kofiNotif.clientHeight}px`); // + initialBodyBottom

    if (isCharacterSheet) { // is character sheet
        initialCharacterButtons ??= parseInt(getComputedStyle(document.getElementById("buttons")).bottom);
        document.getElementById("buttons").style.setProperty("bottom", `${kofiNotif.clientHeight + initialCharacterButtons}px`)
    }
}


if ((await (await notifsPromise).json()).optional.includes(KOFI_NOTIF_ID)) {
    document.body.appendChild(kofiNotif);
    window.addEventListener("resize", adjustScroll);
    document.getElementById("kofi-button").addEventListener("load", adjustScroll);
    adjustScroll();
}

function notifDismissed(choice) {
    fetch("/api/user/dismiss-notification", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            notif_id: KOFI_NOTIF_ID,
            choice,
        })
    })
}

let dismissed = false;

kofiNotif.querySelector("#kofi-link").addEventListener("click", () => {
    kofiNotif.querySelector("#kofi-link").remove();
    kofiNotif.querySelector("#kofi-text").innerText = "Thank you for the support!";
    dismissed = true;
    notifDismissed("accept");
});

kofiNotif.querySelector("#kofi-dismiss").addEventListener("click", () => {
    kofiNotif.remove();
    document.body.style.setProperty("margin-bottom", "0px");
    if (isCharacterSheet) {
        document.getElementById("buttons").style.setProperty("bottom", `${initialBodyBottom}px`);
    }

    if (!dismissed) {
        dismissed = true;
        notifDismissed("reject");
    }
});
