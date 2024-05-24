import React from "./jsx.js";
import { editing } from "./reactiveDisplay.js";
import { sharingApi, initialLinkSharing, editPermission, characterApi } from "./loadCharacter.js";

let linkSharing = initialLinkSharing;

export const controlButtons = {
    map: new Map(),
    enabledWhileViewing: Symbol(),
    enabledWhileDead: Symbol(),

    addButton(button, enabledWhileViewing, enabledWhileDead) {
        this.map.set(button, {
            [this.enabledWhileViewing]: enabledWhileViewing, 
            [this.enabledWhileDead]: enabledWhileDead
        });
        editing.ui.special.push(button);
    },

    get all() {
        return this.map.keys();
    },

    getList(check, checkValue) {
        let r = [];
        for (let [key, value] of this.map) {
            if (value[check] === checkValue) {
                r.push(key);
            }
        }
        return r;
    }
};

const savingIndicator = document.getElementById("saving");
editing.handlers.beforeSave = () => savingIndicator.style.display = "initial";
editing.handlers.afterSave = () => savingIndicator.style.display = "none";

const editButton = document.getElementById("edit");
controlButtons.addButton(editButton, true, false);
editButton.addEventListener("click", () => {
    if (editing.isEditing) {
        editing.stopEditing();
    }
    else {
        editing.startEditing();
    }
});
window.addEventListener("beforeunload", event => {
    if (editing.isEditing || editing.isSaving) {
        event.preventDefault();
    }
});

document.getElementById("collapse").addEventListener("click", () => {
    document.getElementById("collapsible-buttons").classList.toggle("collapse");
});

let currentModal = undefined;
function blurListener(event) {
    if (currentModal && !currentModal.contains(event.target)) {
        event.target.blur();
    }
}

function openModal(element) {
    if (currentModal) {
        throw new Error("Cannot open two modals at once");
    }
    currentModal = element;
    document.body.dataset.modalOpen = "true";
    document.body.addEventListener("focusin", blurListener);
    element.classList.add("open-modal");
}

function closeModal() {
    document.body.dataset.modalOpen = "false";
    document.body.addEventListener("focusin", blurListener);
    currentModal.classList.remove("open-modal");
    currentModal = undefined;
}

const shareButton = document.getElementById("sharing");
const sharingModal = document.getElementById("sharing-modal");
const shareListElement = document.getElementById("direct-sharing-list");
const shareAdd = document.getElementById("direct-sharing-add");
const linkShareDropdown = document.getElementById("link-sharing-dropdown");

controlButtons.addButton(shareButton, true, true);

class ShareTarget {
    isNew = true;

    constructor() {
        const block = this.element = <div class="direct-sharing-row">
            <input type="text" placeholder="username" class="direct-sharing-target" />
            <select name="link-sharing" class="direct-sharing-dropdown">
                <option value="edit">Edit</option>
                <option value="view">View</option>
                <option value="none">None</option>
            </select>
        </div>

        shareList.push(this);
        shareListElement.insertBefore(block, shareAdd);
    }

    get usernameInput() {
        return this.element.getElementsByClassName("direct-sharing-target")[0];
    }

    get permissionInput() {
        return this.element.getElementsByClassName("direct-sharing-dropdown")[0];
    }
}

const shareList = [];

shareButton.addEventListener("click", () => {
    openModal(sharingModal);
});

document.getElementById("sharing-submit").addEventListener("click", async () => {
    Promise.all([submitDirectSharing(), submitLinkSharing()]);

    closeModal();

    for (let i = shareList.length - 1; i >= 0; i--) {
        shareList[i].usernameInput.readOnly = true;

        if (shareList[i].permissionInput.value === "none") {
            shareList[i].element.remove();
            shareList.splice(i, 1);
        }
    }
});

async function submitDirectSharing() {
    const body = [];
    for (let e of shareList) {
        const username = e.usernameInput;
        const permission =  e.permissionInput;

        if (e.isNew || e.oldValue !== permission.value) {
            body.push({ user: username.value, level: permission.value });
        }

        e.oldValue = permission.value;
        e.isNew = false;
    }

    if (body.length) {
        document.body.classList.add("wait")
        const res = await fetch(sharingApi, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });
        document.body.classList.remove("wait");

        if (res.status === 207) {
            const success = [];
            const fail = [];
    
            for (let { user, status } of await res.json()) {
                if (status === 204) {
                    success.push(user);
                }
                else {
                    fail.push(user);
                }
            }

            for (let failed of fail) {
                const i = shareList.findIndex(e => e.usernameInput.value === failed);
                shareList[i].element.remove();
                shareList.splice(i, 1);
            }
    
            let message = "The following user";
            if (fail.length !== 1) {
                message += "s do";
            }
            else {
                message += " does";
            }
            message += " not exist: ";
            message += fail.join(", ");
            if (success.length) {
                message += "\nSuccessfully shared with: ";
                message += success.join(", ");
            }
            alert(message);
        }
        else if (res.status !== 204) {
            if (confirm(`Error ${res.status} attempting to share. Reload page (recommended)?`)) {
                location.reload();
            }
        }
    }
}

async function submitLinkSharing() {
    if (linkShareDropdown.value !== linkSharing) {
        const res = await fetch(characterApi, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                property: "linkSharing",
                value: linkSharing = linkShareDropdown.value,
            }) 
        });
        if (!res.ok) {
            if (confirm(`Error ${res.status} attempting to share. Reload page (recommended)?`)) {
                location.reload();
            }
        }
    }
}

shareAdd.addEventListener("click", () => new ShareTarget());

void async function() {
    const sharing = await (await fetch(sharingApi)).json();
    for (let { username, share_type: permission } of sharing) {
        const row = new ShareTarget();
        row.usernameInput.value = username;
        row.permissionInput.value = row.oldValue = permission;
        row.isNew = false;
    }
    linkShareDropdown.value = linkSharing;
    if (editPermission) {
        shareButton.disabled = false;
    }
}();