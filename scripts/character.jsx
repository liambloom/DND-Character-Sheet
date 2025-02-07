import React from "./jsx.js";

// #region Constants
const [ , characterOwner, , characterTitle ] = new URL(location).pathname.split("/");
const characterJson = `/api/character/${characterOwner}/${characterTitle}`;
const sharingApi = `/api/character/${characterOwner}/${characterTitle}/sharing`;

const newlineRegex = /[\n\r\u2028\u2029]/g;
const statNames = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
const statToSkillMap = {
    "Strength": ["Athletics"],
    "Dexterity": ["Acrobatics", "Slight of Hand", "Stealth"],
    "Intelligence": ["Arcana", "History", "Investigation", "Nature", "Religion"],
    "Wisdom": ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
    "Charisma": ["Deception", "Intimidation", "Performance", "Persuasion"],
}
const skillToStatMap = {};
for (let stat in statToSkillMap) {
    // skillNames.push(...statToSkillMap[stat]);
    for (let skill of statToSkillMap[stat]) {
        skillToStatMap[skill] = stat;
    }
}

const hitDiceTable = {
    "sorcerer": 6,
    "wizard": 6,
    "artificer": 8,
    "bard": 8,
    "cleric": 8,
    "druid": 8,
    "monk": 8,
    "rogue": 8,
    "warlock": 8,
    "fighter": 10,
    "paladin": 10,
    "ranger": 10,
    "barbarian": 12,
};

const moneyDenominations = ["CP", "SP", "EP", "GP", "PP"];

const editable = {
    always: Symbol("Always Editable"),
    inEditingMode: Symbol("In Editing Mode"),
    never: Symbol("Never Editable"),
}

const testElement = document.createElement("div");
testElement.setAttribute("contentEditable", "PLAINTEXT-ONLY");
const supportsPlaintextOnly = testElement.contentEditable === "plaintext-only";
const contentEditableValue = supportsPlaintextOnly ? "plaintext-only" : "true";

function betterParseInt(str) {
    if (/^[+\-]?\d+$/.test(str)) {
        return parseInt(str);
    }
    else 
        throw Error("Invalid int " + str);
}
function unsignedParseInt(str) {
    if (/^\d+$/.test(str)) {
        return parseInt(str);
    }
    else 
        throw Error("Invalid int " + str);
}
const signedIntToStr = n => n > 0 ? "+" + n : n;

const fontCtx = document.createElement("canvas").getContext("2d");
// #endregion

// #region Editing Mode
let editing = false;
let saving = false;
const editingMode = [];
const editingModeInputs = [];
const alwaysEditing = [];
const alwaysEditingInputs = [];
const invalid = [];
const controlButtons = {
    map: new Map(),
    enabledWhileViewing: Symbol(),
    enabledWhileDead: Symbol(),

    addButton(button, enabledWhileViewing, enabledWhileDead) {
        this.map.set(button, {
            [this.enabledWhileViewing]: enabledWhileViewing, 
            [this.enabledWhileDead]: enabledWhileDead
        });
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
async function save() {
    saving = true;
    savingIndicator.style.display = "initial";
    const res = await fetch(characterJson, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            property: "content",
            value: characterData
        }),
    });
    savingIndicator.style.display = "none";
    if (!res.ok) {
        if (confirm(`Error attempting to save changes: "${res.status} - ${res.json().error}." Reload page (recommended)?`)) {
            location.reload();
        }
    }
    saving = false;
}
window.save = save;
function startEditing() {
    editing = true;
    document.body.dataset.editing = "true";

    for (let element of editingMode) {
        element.contentEditable = contentEditableValue;
    }
    for (let element of editingModeInputs) {
        element.disabled = false;
    }
}
function stopEditing() {
    if (invalid.length !== 0) {
        alert("The character sheet contained invalid data and could not be saved");
        return;
    }

    editing = false;
    document.body.dataset.editing = "false";

    save();

    for (let element of editingMode) {
        element.contentEditable = "false";
    }
    for (let element of editingModeInputs) {
        element.disabled = true;
    }
    let changed = document.getElementsByClassName("changed");
    while (changed.length) {
        changed[0].classList.remove("changed");
    }
}
function characterChanged() {
    if (!editing) {
        save();
    }
}
const editButton = document.getElementById("edit");
controlButtons.addButton(editButton, true, false);
editButton.addEventListener("click", () => {
    if (editing) {
        stopEditing();
    }
    else {
        startEditing();
    }
});
window.addEventListener("beforeunload", event => {
    if (editing || saving) {
        event.preventDefault();
    }
});
// #endregion

document.getElementById("collapse").addEventListener("click", () => {
    document.getElementById("collapsible-buttons").classList.toggle("collapse");
});

// #region Reactivity & Other Classes
class DataDisplay {
    constructor(args) {
        this.changeListeners = [];
        this.invalidationListeners = [];
        this.element = args.element;
        this.dataObject = args.dataObject ?? characterData;
        this.property = args.property;
        this.getValue = args.getValue ?? (() => this.dataObject[this.property]);
        this.dataToString = args.dataToString ?? (v => "" + v);
        this.dataFromString = args.dataFromString ?? (v => v);
        this.validate = args.validate ?? (() => true);
        this.allowNewlines = args.allowNewlines ?? false;
        this.getDefault = args.getDefault;
        this.editable = args.editable ?? editable.inEditingMode;
        this.autoResize = args.autoResize ?? false;
        this.inCharacterSheet = args.inCharacterSheet ?? true;
        this.oldValue = Symbol("Original Value");
        const { listenTo = [] } = args;

        switch (this.editable) {
            case editable.always:
                this.element.contentEditable = contentEditableValue;
                if (this.inCharacterSheet) {
                    alwaysEditing.push(this.element);
                }
                break;
            case editable.inEditingMode:
                if (this.inCharacterSheet) {
                    editingMode.push(this.element);
                }
                this.element.contentEditable = editing ? contentEditableValue : "false";
                break;
        }

        if (this.allowNewlines) {
            this.element.classList.add("multi-line-text");
        }

        for (let e of listenTo) {
            this.listenTo(e);
        }

        this.element.addEventListener("paste", event => {
            event.preventDefault();
            const selection = getSelection();
            let first = true;
            for (let i = 0; i < selection.rangeCount; i++) {
                const range = selection.getRangeAt(i);
                if (range.startContainer === this.element.childNodes[0] || range.startContainer === this.element) {
                    range.deleteContents();
                    let content = event.clipboardData.getData("text/plain");
                    if (!this.allowNewlines) {
                        content = content.replace(newlineRegex, "");
                    }
                    range.insertNode(document.createTextNode(content));
                    range.collapse();
                    this.element.normalize();

                    if (!first) {
                        selection.removeRange(prevRange);
                    }
                    first = false;
                }
            }

            this.checkElementValidity();
            this.maybeResizeFont();
        });

        let index;
        this.element.addEventListener("beforeinput", event => {
            this.element.normalize();
            const selection = getSelection();
            const repeatedOffset = event.data ? event.data.replace(newlineRegex, "").length : 0;
            index = selection.getRangeAt(0).startOffset + repeatedOffset;
            for (let i = 0; i < selection.rangeCount; i++) {
                const range = selection.getRangeAt(i);
                if (range.startContainer === this.element.childNodes[0]) {
                    index = range.startOffset + repeatedOffset;
                    break;
                }
            }
        });

        this.element.addEventListener("input", event => {
            if (!this.allowNewlines && newlineRegex.test(this.element.innerText)) {
                const brs = this.element.getElementsByTagName("br");
                while (brs.length) {
                    brs[0].remove();
                }
                this.element.innerText = this.element.innerText.replace(newlineRegex, "");
                this.element.normalize();
                const selection = getSelection();
                const node = this.element.childNodes[0] ?? this.element;
                for (let i = 0; i < selection.rangeCount; i++) {
                    const range = selection.getRangeAt(i);
                    if (range.startContainer === this.element || range.startContainer === node) {
                        selection.removeRange(range);
                    }
                }

                if (!node.nodeValue?.length) {
                    index = 0;
                }

                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index)
                selection.addRange(range);
            }

            this.maybeResizeFont();
            this.checkElementValidity();
        });

        this.element.addEventListener("focus", () => {
            this.element.classList.remove("changed");
        });

        this.element.addEventListener("click", event => {
            event.preventDefault();
        });

        this.element.addEventListener("blur", () => {
            let doListeners;
            if (this.getDefault?.() != null && this.element.innerText === "") {
                delete this.dataObject[this.property];
                doListeners = true;
            }
            else {
                const parse = this.parse(this.element.innerText);
                if (parse.isValid && this.dataObject[this.property] !== parse.value && (this.allowNewlines || !newlineRegex.test(this.element.innerText))) {
                    this.dataObject[this.property] = parse.value;
                    if (this.inCharacterSheet) {
                        characterChanged();
                    }
                    doListeners = true;
                }
                else {
                    doListeners = false;
                }
            }
            this.element.parentElement.scroll(0, 0);
            this.update(doListeners);
        });
        if (!this.allowNewlines) {
            this.element.addEventListener("keydown", event => {
                if (event.key === "Enter" && !(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)) {
                    this.element.blur();
                }
            });
        }

        this.update();
    }

    listenTo(e) {
        e.addChangeListener(() => {
            if (editing && this.valueExists) {
                this.element.classList.add("changed");
            }
            this.update()
        });
    }

    maybeResizeFont() {
        if (this.autoResize) {
            let element = this.element.parentElement.classList.contains("inputLine") ? this.element.parentElement : this.element;

            const computedStyles = getComputedStyle(element);
            if (!element.style.getPropertyValue("font-size")) {
                const str = computedStyles.getPropertyValue("font-size");
                this.initialFontSize = parseInt(str);
            }
            if (this.initialFontSize === undefined || isNaN(this.initialFontSize)) {
                throw new Error("No initial font size calculated");
            }
            const style1 = ["style", "variant", "weight"].map(p => computedStyles.getPropertyValue("font-" + p)).join(" ");
            const family = computedStyles.getPropertyValue("font-family");

            if (computedStyles.getPropertyValue("font-stretch") !== "100%") {
                throw new Error("I didn't write support for font auto resizing that takes into account font-stretch");
            }

            const generateFont = size => `${style1} ${size}px ${family}`;

            const text = (this.element.innerText || this.element.dataset.default) ?? "";

            let fontSize;
            for (fontSize = this.initialFontSize; fontSize > 10; fontSize--) {
                fontCtx.font = generateFont(fontSize);
                if (fontCtx.measureText(text).width <= element.parentElement.clientWidth) {
                    break;
                }
            }

            if (fontSize === this.initialFontSize) {
                element.style.removeProperty("font-size");
            }
            else {
                element.style.setProperty("font-size", fontSize + "px");
            }
        }
    }

    checkElementValidity() {
        const parsed = this.parse(this.element.innerText);
        const actual = parsed.isValid;
        const display = actual || this.element.innerText === "" && (this.element === document.activeElement || "default" in this.element.dataset);
        if (display) {
            this.element.classList.remove("invalid");
        }
        else {
            this.element.classList.add("invalid");
        }
        for (let callback of this.invalidationListeners) {
            callback(actual, display, parsed.value);
        }

        return { actual, display };
    }

    parse(v) {
        try {
            let val = this.dataFromString(v);
            if (typeof val === "string") {
                val = val.replace(/(?:^[\n\r\u2028\u2029]+)|(?:[\n\r\u2028\u2029]+$)/g, "")
            }
            return {
                isValid: this.validate(val) && (typeof val !== "number" || val < Number.MAX_SAFE_INTEGER),
                value: val,
            };
        }
        catch {
            return { isValid: false };
        }
    }

    get value() {
        return this.valueExists ? this.getValue() : this.getDefault();
    }

    get valueExists() {
        return !this.dataObject || this.property in this.dataObject;
    }

    update(doListeners = true) {
        const valueExists = this.valueExists;
        const value = valueExists ? this.value : undefined;
        const str = valueExists ? this.dataToString(this.value) : "";
        this.element.innerText = str;
        let publicValue, publicValueString;
        
        if (this.getDefault) {
            const defaultVal = this.getDefault();
            if (defaultVal === null) {
                delete this.element.dataset.default;
            }
            else {
                publicValue = defaultVal;
                publicValueString = this.element.dataset.default = this.dataToString(defaultVal);
            }
        }

        if (this.inCharacterSheet) {
            const index = invalid.indexOf(this);
            if (this.checkElementValidity().display) {
                if (index >= 0) {
                    invalid.splice(index, 1);
                }
            }
            else {
                if (index === -1) {
                    invalid.push(this);
                }
            }
        }

        this.maybeResizeFont();

        if (valueExists) {
            publicValue = value;
            publicValueString = str;
        }

        const changed = publicValue !== this.oldValue;
        this.oldValue = publicValue;

        if (doListeners && changed) {
            for (let listener of this.changeListeners) {
                listener(publicValue, publicValueString, valueExists);
            }
        }
    }

    addChangeListener(callback) {
        this.changeListeners.push(callback);
    }

    removeChangeListener(callback) {
        this.changeListeners.splice(this.changeListeners.indexOf(callback), 1);
    }

    addInvalidationListener(callback) {
        this.invalidationListeners.push(callback);
    }

    removeInvalidationListener(callback) {
        this.invalidationListeners.splice(this.invalidationListeners.indexOf(callback), 1);
    }
}

class Fraction {
    constructor(element, numerArgs, denomArgs) {
        this.element = element;
        if (this.element.childNodes.length) {
            this.numerElement = this.element.querySelector("[data-numer]");
            this.denomElement = this.element.querySelector("[data-denom]");
        }
        else {
            this.numerElement = document.createElement("span");
            this.denomElement = document.createElement("span");
            element.appendChild(this.numerElement)
            element.appendChild(document.createTextNode(" / "));
            element.appendChild(this.denomElement);
        }

        this.denomDisplay = new DataDisplay({
            element: this.denomElement,
            validate: n => n > 0,
            dataFromString: unsignedParseInt,
            ...denomArgs,
        });

        this.numerDisplay = new DataDisplay({
            element: this.numerElement,
            validate: n => n >= 0 && n <= this.denomDisplay.value,
            dataFromString: unsignedParseInt,
            listenTo: [ this.denomDisplay ],
            editable: editable.always,
            ...numerArgs,
        });
    }
}

class Proficiency {
    constructor(block, group, name, stat, defaultMap = n => n) {
        block = this.element ||= <div class={group + " proficiency"} id={name}>
            <label for={name + "Checkbox"}><input id={name + "Checkbox"} type="checkbox" name={group + "Checkbox"}
                   class={group + "Checkbox proficiencyCheckbox"} disabled="true"></input><div class="customCheckbox"></div><span class={group + "Bonus proficiencyBonus"}></span> {name} <span
                class="proficiencyBonusStat">({stat.substring(0, 3)})</span>
            </label>
        </div>;
        const statMod = stats[stat].mod;
        const bonus = this.bonus = new DataDisplay({
            element: block.getElementsByClassName("proficiencyBonus")[0],
            getDefault: () => defaultMap(statMod.value
                + (characterData[group].proficiencies.indexOf(name) === -1 ? 0 : proficiencyBonus.value)),
            dataObject: characterData[group].bonuses,
            property: name,
            dataToString: signedIntToStr,
            dataFromString: betterParseInt,
            validate: n => !isNaN(n),
            listenTo: [ statMod, proficiencyBonus ],
        });

        const checkbox = this.checkbox = block.getElementsByClassName("proficiencyCheckbox")[0];

        editingModeInputs.push(checkbox);

        checkbox.checked = characterData[group].proficiencies.indexOf(name) >= 0;

        checkbox.addEventListener("input", () => {
            if (checkbox.checked) {
                characterData[group].proficiencies.push(name);
            }
            else {
                characterData[group].proficiencies.splice(characterData[group].proficiencies.indexOf(name), 1);
            }

            bonus.update();
        });
    }
}

class List {
    constructor(element, data, newValue, ThisListItem) {
        element.classList.add("list");

        this.element = element;
        this.data = data;
        this.contents = [];
        
        const addButton = this.addButton = <button class="list-add" type="button">
            <div class="list-add-line"></div>
            <div class="list-plus">
                <div class="list-plus-h"></div>
                <div class="list-plus-v"></div>
            </div>
            <div class="list-add-line"></div>
        </button>

        element.appendChild(addButton);

        addButton.addEventListener("click", () => {
            const value = newValue();
            this.contents.push(new ThisListItem(this, value));
            data.push(value);
        });

        for (let value of data) {
            this.contents.push(new ThisListItem(this, value));
        }
    }
}

class ListItem {
    constructor(list) {
        const block = this.element = <div class="list-row">
            <div class="list-move">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <button class="list-delete" type="button"><img src="/static/img/trash.png"></img></button>
        </div>;

        block.getElementsByClassName("list-delete")[0].addEventListener("click", () => {
            block.remove();
            const index = list.contents.indexOf(this);
            list.contents.splice(index, 1);
            list.data.splice(index, 1);
        });

        const handle = block.getElementsByClassName("list-move")[0];
        let dragging = false;
        let startY;
        handle.addEventListener("mousedown", e => {
            dragging = true;
            block.classList.add("dragging");
            document.body.classList.add("dragHappening");
            startY = e.screenY;
        });
        window.addEventListener("mousemove", e => {
            if (dragging) {
                let dy = e.screenY - startY;

                if (this === list.contents[0] && dy < 0) {
                    dy = 0;
                }
                if (this === list.contents[list.contents.length - 1] && dy > 0) {
                    dy = 0;
                }

                block.style.setProperty("translate", `0 ${dy}px`);

                const midpoint = block.offsetTop + block.clientHeight / 2 + dy;
                let colliding;
                let collidingIndex;
                for (let i = 0; i < list.contents.length; i++) {
                    const other = list.contents[i];
                    if (this === other) {
                        continue;
                    }

                    const otherMidpoint = other.element.offsetTop + other.element.clientHeight / 2;

                    if (other.element.offsetTop <= midpoint && midpoint <= other.element.offsetTop + other.element.clientHeight
                            && this.element.offsetTop + dy <= otherMidpoint && otherMidpoint <= this.element.offsetTop + dy + this.element.clientHeight) {
                        colliding = other;
                        collidingIndex = i;
                        break;
                    }
                }

                if (colliding) {
                    const ownIndex = list.contents.indexOf(this);
                    const prevY = block.offsetTop;

                    block.remove();
                    if (ownIndex > collidingIndex) {
                        list.element.insertBefore(block, colliding.element);
                    }
                    else {
                        list.element.insertBefore(block, colliding.element.nextElementSibling);
                    }

                    list.contents.splice(ownIndex, 1);
                    list.contents.splice(collidingIndex, 0, this);

                    const jsonValue = list.data[ownIndex];
                    list.data.splice(ownIndex, 1);
                    list.data.splice(collidingIndex, 0, jsonValue);

                    startY += block.offsetTop - prevY;
                    dy = e.screenY - startY;
                    block.style.setProperty("translate", `0 ${dy}px`);
                }
            }
        });
        function endDrag() {
            dragging = false;
            block.classList.remove("dragging");
            block.style.removeProperty("translate");
            document.body.classList.remove("dragHappening");
        }
        window.addEventListener("mouseup", endDrag);
        window.addEventListener("mouseleave", endDrag);

        list.element.insertBefore(block, list.addButton);
    }
}
// #endregion

// #region Fetch character data
const charResponse = await fetch(characterJson);

if (!charResponse.ok) {
    alert(`Error retrieving character data\n${charResponse.status} - ${charResponse.statusText}\n$${res.text()}`);
}
const parsedCharResponse = await charResponse.json();
const { content: characterData, editPermission, ownerDisplayName, title } = parsedCharResponse
let { linkSharing } = parsedCharResponse;
window.characterData = characterData;

for (let skill of characterData.skills.proficiencies) {
    if (!(skill in skillToStatMap)) {
        alert("The character sheet is invalid");
        throw new Error(`Cannot have proficiency in ${skill} because no such skill exists`);
    }
}
// #endregion

document.getElementById("title").innerText = title;

// const titleDisplay = new DataDisplay({
//     element: document.getElementById("title"),
//     dataObject: { title },
//     property: "title",
//     validator: s => /,
//     editable: editable.always
// });

// titleDisplay.addChangeListener(value => {

// })

// #region Character Data
const characterName = new DataDisplay({
    element: document.getElementById("name-value"),
    property: "name",
    autoResize: true,
});
const ripName = new DataDisplay({
    element: document.getElementById("rip-name"),
    getDefault: () => characterName.value,
    listenTo: [ characterName ],
    editable: editable.never,
});
characterName.addChangeListener((_, str) => document.title = str + " Character Sheet");
document.title = characterData.name + " Character Sheet";

const characterLevel = classes => classes.reduce((total, c) => total + c.level, 0);

const classAndLvl = new DataDisplay({
    element: document.getElementById("classAndLvl"),
    property: "classes",
    dataFromString: str => {
        const regex = /^\s*([^\n/]+?)\s+(1?[1-9]|[12]0)\s*$/;
        let data = [];
        for (let readClass of str.split("/")) {
            let parsed = readClass.match(regex);
            
            data.push({"class": parsed[1], level: +parsed[2]});
        }

        return data;
    },
    validate: arr => arr.length !== 0 && characterLevel(arr) <= 20,
    dataToString: data => data.map(d => `${d["class"]} ${d.level}`).join(" / "),
});

Object.defineProperty(classAndLvl, "characterLevel", {
    get() {
        return characterLevel(classAndLvl.value);
    },
    enumerable: true,
});

const background = new DataDisplay({
    element: document.getElementById("background"),
    property: "background",
});

const playerName = new DataDisplay({
    element: document.getElementById("playerName"),
    dataObject: { ownerDisplayName },
    property: "ownerDisplayName",
    editable: editable.never,
})

const race = new DataDisplay({
    element: document.getElementById("race"),
    property: "race",
});

const alignment = new DataDisplay({
    element: document.getElementById("alignment"),
    property: "alignment",
})

const xp = new DataDisplay({
    element: document.getElementById("xp"),
    property: "xp",
    dataFromString: unsignedParseInt,
    editable: editable.always,
});

const stats = {};

for (let statName of statNames) {
    const block = <div class="stat" id={statName}>
        <div class="sectionTitle staticPos">{statName}</div>
        <div class="stat-val ignore-invalid"><div></div></div>
        <div class="stat-mod inherit-invalid"><div></div></div>
    </div>
    document.getElementById("stats").appendChild(block);

    stats[statName] = {};
    const stat = stats[statName].stat = new DataDisplay({
        element: block.getElementsByClassName("stat-val")[0].children[0],
        validate: n => n > 0,
        dataObject: characterData.stats, 
        property: statName, 
        dataFromString: betterParseInt,
    });
    const args = {
        element: block.getElementsByClassName("stat-mod")[0].children[0],
        getDefault: () => Math.floor((stat.value - 10) / 2),
        dataToString: signedIntToStr,
        listenTo: [ stat ],
        editable: editable.never,
    };
    const mod = stats[statName].mod = new DataDisplay(args);

    stat.addInvalidationListener((_, isValid) => {
        block.classList[isValid ? "remove" : "add"]("invalid");
    });
}

const proficiencyBonus = new DataDisplay({
    element: document.getElementById("proficiencyBonus"),
    getDefault: () => Math.floor((classAndLvl.characterLevel - 1) / 4) + 2,
    dataToString: n => "+" + n,
    listenTo: [ classAndLvl ],
    editable: editable.never,
});

const skills = {};
for (let skill of Object.keys(skillToStatMap).sort()) {
    const skillData = new Proficiency(undefined, "skills", skill, skillToStatMap[skill]);
    skills[skill] = skillData;
    document.getElementById("skills").appendChild(skillData.element);
}

const savingThrows = [];
for (let stat of statNames) {
    const savingThrowData = new Proficiency(undefined, "savingThrows", stat, stat);
    savingThrows.push(savingThrowData);
    document.getElementById("savingThrows").appendChild(savingThrowData.element);
}

const perceptionStandalone = new DataDisplay({
    element: document.getElementById("perceptionValue"),
    getDefault: () => 10 + skills.Perception.bonus.value,
    listenTo: [ skills.Perception.bonus ],
    editable: editable.never,
})

const inspiration = document.getElementById("inspiration");
if (characterData.inspiration) {
    inspiration.checked = true;
}
inspiration.addEventListener("change", () => {
    characterData.inspiration = inspiration.checked;
    characterChanged();
});
alwaysEditingInputs.push(inspiration);

const ac = new DataDisplay({
    element: document.getElementById("ac"),
    property: "ac",
    dataFromString: unsignedParseInt,
    validate: n => n > 0,
    listenTo: [ stats.Dexterity.mod ],
    autoResize: true,
});
const initiative = new DataDisplay({
    element: document.getElementById("initiative"),
    getDefault: () => stats.Dexterity.mod.value,
    dataToString: signedIntToStr,
    editable: editable.never,
    listenTo: [ stats.Dexterity.mod ],
});
const speed = new DataDisplay({
    element: document.getElementById("speed"),
    property: "speed",
    dataFromString: unsignedParseInt,
    validate: n => n > 0,
    autoResize: true,
});
const tempHp = new DataDisplay({
    element: document.getElementById("temp-hp-value"),
    property: "tempHp",
    dataFromString: unsignedParseInt,
    validate: n => n >= 0,
    editable: editable.always,
});
function hitDieFromString(str) {
    let [ n, d, err ] = str.split("d");
    if (err || !n || !d) {
        throw new Error();
    }
    return {d: unsignedParseInt(d), n: unsignedParseInt(n)};
}
function hitDieToString(die) {
    return `${die.n}d${die.d}`;
}
const hitDiceArgs = {
    dataFromString: str => str.split("+").map(hitDieFromString),
    dataToString: dice => dice.map(hitDieToString).join("+"),
}
const totalHitDice = new DataDisplay({
    ...hitDiceArgs,
    element: document.getElementById("hit-dice-total"),
    property: "hitDiceTotal",
    validate: val => val.map(({n}) => n).reduce((sum, v) => sum + v) === classAndLvl.characterLevel,
    getDefault: () => {
        const v = [];
        for (let c of classAndLvl.value) {
            const d = hitDiceTable[c.class.toLowerCase()];
            if (!d) {
                return null;
            }
            v.push({ n: c.level, d });
        }
        return v;
    },
    listenTo: [ classAndLvl ],
});
const hitDice = new DataDisplay({
    ...hitDiceArgs,
    element: document.getElementById("hit-dice-value"),
    property: "hitDice",
    validate: val => {
        const total = totalHitDice.value;
        let i = 0;
        for (let j = 0; j < total.length; j++) {{
            if (i >= val.length) {
                break;
            }
            if (val[i]?.d === total[j].d && val[i]?.n <= total[j].n) {
                i++;
            }
        }}
        return i === val.length;
    }, 
    getDefault: () => totalHitDice.value,
    listenTo: [ classAndLvl, totalHitDice ],
    autoResize: true,
});

const dieAvg = (d, n) => (Math.ceil((d - 1) / 2) + 1) * n;
const hp = new Fraction(
    document.getElementById("health"), 
    { property: "hp" }, 
    { 
        property: "maxHp", 
        getDefault: () => totalHitDice.value === null ? null : totalHitDice.value[0].d + stats.Constitution.mod.value * classAndLvl.characterLevel 
            + dieAvg(totalHitDice.value[0].d, totalHitDice.value[0].n - 1) + totalHitDice.value.slice(1).map(({d, n}) => dieAvg(d, n)).reduce((sum, v) => sum + v, 0),
        listenTo: [ stats.Constitution.mod, classAndLvl, totalHitDice ],
    }
);

for (let display of [ac, speed, hp.numerDisplay, hp.denomDisplay, tempHp, hitDice, totalHitDice]) {
    display.addInvalidationListener((_, isValid) => {
        display.element.parentElement.classList[isValid ? "remove" : "add"]("invalid");
    });
}

const newSpellSheetButton = document.getElementById("add-spell-sheet");
editingModeInputs.push(newSpellSheetButton);

const deathSaveBoxes = Array.from(document.getElementById("death-saves").getElementsByTagName("input"));
const killButton = document.getElementById("kill");
controlButtons.addButton(killButton, true, false);

function die() {
    if (!characterData.dead) {
        characterData.dead = true;

        delete characterData.hitDice;
        hitDice.update();

        document.body.classList.add("death-animation");
        const animations = document.getElementById("death-overlay").getAnimations();
        animations[0].onfinish = () => {
            document.body.classList.remove("unconscious");
            document.body.classList.add("dead");
        };
        animations[1].onfinish = () => {
            document.body.classList.remove("death-animation");
        }
    }
    else {
        document.body.classList.add("dead");
    }

    characterData.hp = 0;
    hp.numerDisplay.update();
    stopEditing();

    for (let element of alwaysEditing) {
        element.contentEditable = "false";
    }
    for (let element of [...alwaysEditingInputs, ...deathSaveBoxes, ...controlButtons.getList(controlButtons.enabledWhileDead, false)]) {
        element.disabled = true;
    }
}

function revive() {
    characterData.dead = false;
    document.body.classList.remove("dead");

    characterData.hp = 1;
    hp.numerDisplay.update();
    characterChanged();

    for (let element of alwaysEditing) {
        element.contentEditable = contentEditableValue;
    }
    for (let element of [...alwaysEditingInputs, ...controlButtons.getList(controlButtons.enabledWhileDead, false)]) {
        element.disabled = false;
    }
}

const reviveButton = document.getElementById("revive");
reviveButton.addEventListener("click", revive);
controlButtons.addButton(reviveButton, true, true);
killButton.addEventListener("click", die);

function updateConsciousness() {
    const unconscious = hp.numerDisplay.value === 0;
    for (let checkbox of deathSaveBoxes) {
        checkbox.disabled = !unconscious;
        if (!unconscious) {
            checkbox.checked = false;
        }
    }

    if (unconscious) {
        if (!("deathSaves" in characterData)) {
            characterData.deathSaves = { success: 0, fail: 0 };
            characterChanged();
        }
        document.documentElement.dataset.failedDeathSaves = characterData.deathSaves.fail;
    }
    else {
        if ("deathSaves" in characterData) {
            delete characterData.deathSaves;
            characterChanged();
        }
        delete document.documentElement.dataset.failedDeathSaves
    }

    document.body.classList[unconscious && characterData.deathSaves?.success !== 3 && !characterData.dead 
        ? "add" : "remove"]("unconscious");
};
hp.numerDisplay.addChangeListener(updateConsciousness);
updateConsciousness();

class DeathSaves {
    constructor(type) {
        this.type = type;

        this.checkboxes = Array.from(document.getElementById(`ds-${this.type}-counter`).getElementsByTagName("input"));

        for (let i = 0; i < this.checkboxes.length; i++) {
            const checkbox = this.checkboxes[i];
            checkbox.addEventListener("click", () => {
                let value = i + 1;//this.checkboxes.findLastIndex(box => box.checked) + 1;
                if (value === characterData.deathSaves[type]) {
                    value--;
                }
                characterData.deathSaves[type] = value;
                characterChanged();
                this.update();
            });
        }

        this.update();
    }

    update() {
        if ("deathSaves" in characterData) {
            for (let i = 0; i < characterData.deathSaves[this.type]; i++) {
                this.checkboxes[i].checked = true;
            }
            for (let i = characterData.deathSaves[this.type]; i < this.checkboxes.length; i++) {
                this.checkboxes[i].checked = false;
            }
            if (this.type === "fail") {
                if (characterData.deathSaves.fail === 3) {
                    die();
                }
                else {  
                    document.documentElement.dataset.failedDeathSaves = characterData.deathSaves.fail;
                }
            }
            if (this.type === "success") {
                updateConsciousness();
            }
        }
    }
}
const successfulDeathSaves = new DeathSaves("success");
const failedDeathSaves = new DeathSaves("fail");
if (characterData.dead && characterData.deathSaves?.fail !== 3) {
    die();
}

const otherProficiencies = [];
for (let prof of ["armor", "weapons", "tools", "languages"]) {
    const element = document.getElementById(prof + "-prof");

    const display = new DataDisplay({
        element,
        dataObject: characterData.otherProficiencies,
        property: prof,
        allowNewlines: true,
    });
    otherProficiencies.push(display);
}

const attacksText = new DataDisplay({
    element: document.getElementById("attacks-text"),
    property: "attacksText",
    allowNewlines: true,
});

class Weapon extends ListItem {
    constructor(list, weapon) {
        super(list);
        
        const block = <div class="weapon-content">
            <div class="weapon-name"><span class="weapon-name-value"></span></div>
            <div class="weapon-bonus"><span class="weapon-bonus-value"></span></div>
            <div class="weapon-damage"><span class="weapon-damage-value"></span></div>
        </div>;

        this.value = {
            name: new DataDisplay({
                element: block.getElementsByClassName("weapon-name-value")[0],
                dataObject: weapon,
                property: "name",
            }),
            bonus: new DataDisplay({
                element: block.getElementsByClassName("weapon-bonus-value")[0],
                dataObject: weapon,
                property: "bonus",
                dataFromString: betterParseInt,
                dataToString: signedIntToStr,
                listenTo: [stats.Strength.mod, stats.Dexterity.mod, proficiencyBonus],
            }),
            damage: new DataDisplay({
                element: block.getElementsByClassName("weapon-damage-value")[0],
                dataObject: weapon,
                property: "damage",
                listenTo: [stats.Strength.mod, stats.Dexterity.mod, proficiencyBonus],
            }), 
        };

        this.element.appendChild(block);
    }
}

const weapons = new List(document.getElementById("attacks-table"), characterData.weapons, 
    () => ({ name: "Name", bonus: 0, damage: "0 type" }), Weapon);

const moneyElement = document.getElementById("money");
const money = [];
for (let denom of moneyDenominations) {

    const block = <div id={"money-" + denom.toLowerCase()} class="money-denom">
        <div class="money-denom-label-container">
            <div class="money-denom-label">{denom.toUpperCase()}</div>
        </div>
        <div class="money-value-container">
            <div class="money-value"></div>
        </div>
    </div>;

    money.push(new DataDisplay({
        element: block.getElementsByClassName("money-value")[0],
        dataObject: characterData.money,
        property: denom,
        dataFromString: unsignedParseInt,
        editable: editable.always,
    }));

    moneyElement.appendChild(block);
}

const equipmentText = new DataDisplay({
    element: document.getElementById("equipment-text"),
    property: "equipmentText",
    allowNewlines: true,
});

class Feature extends ListItem {
    constructor(list, data) {
        super(list);
        const block = <div class="feature multi-line-text">
            <span class="feature-name multi-line-text">
                <span class="feature-name-text multi-line-text"></span><span class="feature-uses">
                    <input type="checkbox" class="feature-uses-checkbox default-checkbox"></input>
                    <span class="feature-uses-blank">(_ / _)</span><span class="feature-uses-value-container">(<span class="feature-uses-value"></span>)</span>
                </span>:</span> <span class="feature-text multi-line-text"></span>
        </div>;

        this.data = data;

        this.name = new DataDisplay({
            element: block.getElementsByClassName("feature-name-text")[0],
            dataObject: data,
            property: "name",
        });

        this.text = new DataDisplay({
            element: block.getElementsByClassName("feature-text")[0],
            dataObject: data,
            property: "text",
            allowNewlines: true,
        });

        this.checkbox = block.getElementsByClassName("feature-uses-checkbox")[0];
        // this.usesBlank = block.getElementsByClassName("feature-uses-blank")[0];
        this.usesValue = block.getElementsByClassName("feature-uses-value")[0];
        this.usesContainer = block.getElementsByClassName("feature-uses")[0];
        
        this.checkbox.checked = "maxUses" in data;
        this.updateFeatureUses();
        this.checkbox.addEventListener("change", () => this.updateFeatureUses());

        editingModeInputs.push(this.checkbox);
        this.checkbox.disabled = !editing;

        this.element.appendChild(block);
    }

    updateFeatureUses() {
        if (this.checkbox.checked) {
            if (!this.data.maxUses) {
                this.data.currentUses = 1;
                this.data.maxUses = 1;
            }
            this.uses = new Fraction(this.usesValue, { dataObject: this.data, property: "currentUses" }, { dataObject: this.data, property: "maxUses" });
            this.uses.numerElement.classList.add("multi-line-text");
            this.uses.denomElement.classList.add("multi-line-text");
        }
        else {
            delete this.data.currentUses;
            delete this.data.maxUses;
            if (this.uses) {
                for (let display of [ this.uses.numerDisplay, this.uses.denomDisplay ]) {
                    const index = invalid.indexOf(display);
                    if (index >= 0) {
                        invalid.splice(display, 1);
                    }
                }
            }
            this.usesValue.innerHTML = "";
        }
    }
}

const features = new List(document.getElementById("features-list"), characterData.features, () => ({ name: "Name", text: "Description" }), Feature);
// #endregion

// #region Spellcasting
class Spell {
    static counter = 0;

    constructor(castingClass, level, spellNum) {
        const checkboxName = "spellPreparedCheckbox" + Spell.counter++;
        const block = this.block = <div>
            <label for={checkboxName} class="spell-entry">
                <input id={checkboxName} type="checkbox" name={`level-${level}-spells`} class="spellPrepared" disabled="true"/>
                <div class="customCheckbox"></div>
                <div class="spell-name-container">
                    <span class="spell-name"></span>
                </div>
                <div class="spell-phantom" contentEditable="false">.</div>
            </label>
        </div>

        const dataObject = castingClass.levels[level].spells[spellNum];

        this.name = new DataDisplay({
            element: block.getElementsByClassName("spell-name")[0],
            dataObject,
            property: "name",
        });


        if (level > 0) {
            const checkbox = block.getElementsByClassName("spellPrepared")[0];
            editingModeInputs.push(checkbox);

            checkbox.checked = dataObject.prepared;

            checkbox.addEventListener("input", () => {
                dataObject.prepared = checkbox.checked;
                characterChanged();
            });
        }
    }
}

class SpellLevel {
    constructor(dataObject, level) {
        const block = this.block = <div class={`spell-level ${level ? "" : "cantrips"}`}>
            <div class="spell-level-title">
                <div class="spell-level-label-container">
                    <div class="spell-level-label">{level}</div>
                </div>
                <div class="slots-total-container">
                    <div class="slots-total" data-denom></div>
                </div>
                <div class="slots-expended-outer-container">   
                    <div class="slots-expended-inner-container">
                        <div class="slots-expended" data-numer>{level ? "" : "Cantrips"}</div>
                    </div>
                </div>
            </div>
            <div class="spell-list"></div>
        </div>

        const levelObj = dataObject.levels[level];

        if (level > 0) {
            // new Fraction(
            //     block.getElementsByClassName("spell-level-title")[0], 
            //     { dataObject: characterData.spellSlots[level], property: "expended", getDefault: () => 0/*, listenTo: nHub*/ }, 
            //     { dataObject: characterData.spellSlots[level], property: "total", validate: n => n >= 0/*, listenTo: dHub*/ }
            // );
            SpellLevel.getSlotsSpoke(level, block.getElementsByClassName("spell-level-title")[0]);
        }

        for (let spell = 0; spell < levelObj.spells.length; spell++) {
            const spellObj = new Spell(dataObject, level, spell);
            block.getElementsByClassName("spell-list")[0].appendChild(spellObj.block);
        }
    }

    static hubs = [];

    static getSlotsSpoke(level, element) {
        let nHub, dHub;
        if (this.hubs[level]) {
            nHub = [this.hubs[level].numerDisplay];
            dHub = [this.hubs[level].denomDisplay];
        }
        else {
            nHub = dHub = [];
        }

        const slots = new Fraction(
            element, 
            { dataObject: characterData.spellSlots[level], property: "expended", getDefault: () => 0, listenTo: nHub }, 
            { dataObject: characterData.spellSlots[level], property: "total", validate: n => n >= 0, listenTo: dHub }
        );
        if (this.hubs[level]) {
            this.hubs[level].numerDisplay.listenTo(slots.numerDisplay);
            this.hubs[level].denomDisplay.listenTo(slots.denomDisplay);
        }
        this.hubs[level] ??= slots;
        return slots;
    }
}

class SpellSheet {
    constructor(i) {
        const block = this.block = <div class="page spell-page">
            <header class="page-header">
                <button class="spellsheet-delete" type="button">
                    <img src="/static/img/trash.png"/>
                </button>
                <div class="left-header-banner">
                    <div class="header-banner-back"></div>
                </div>
                <div class="header-labeled-container">
                    <div class="header-large-value-box">
                        <div class="header-large-value-container">
                            <div class="spellcasting-class-value header-large-value"></div>
                        </div>
                    </div>
                    <div class="header-label header-large-label">Spellcasting Class</div>
                </div>
                <div class="header-other spellcasting-header-other">
                    <div>
                        <div class="header-other-contents spellcasting-header-other-contents">
                            <div class="spellcasting-header-value">
                                <div class="spellcasting-ability"></div>
                            </div>
                            <div class="spellcasting-header-value">
                                <div class="spell-save-dc"></div>
                            </div>
                            <div class="spellcasting-header-value">
                                <div class="spell-atk-bonus"></div>
                            </div>
                            <div class="header-label">Spellcasting Ability</div>
                            <div class="header-label">Spell Save DC</div>
                            <div class="header-label">Spell Attack Bonus</div>
                        </div>
                    </div>
                </div>
                <div class="right-header-banner"></div>
            </header>
            <div class="spell-columns">
                <div class="spell-column"></div>
                <div class="spell-column"></div>
                <div class="spell-column"></div>
            </div>
        </div>

        const dataObject = characterData.spellcasting[i];

        new DataDisplay({
            element: block.getElementsByClassName("spellcasting-class-value")[0],
            property: "class",
            dataObject,
        });

        const ability = new DataDisplay({
            element: block.getElementsByClassName("spellcasting-ability")[0],
            property: "ability",
            dataObject: dataObject,
            dataFromString: v => {
                if (!v.length) {
                    throw Error("Empty spellcasting stat");
                }

                v = v.charAt(0).toUpperCase() + v.substring(1).toLowerCase();

                let j = statNames.indexOf(v);
                if (j !== -1) {
                    return v;
                }
                
                j = statNames.map(v => v.substring(0, 3)).indexOf(v);
                if (j !== -1) {
                    return statNames[j];
                }
                else {
                    throw Error(v + " is not a stat");
                }
            },
            dataToString: v => {
                return v.substring(0, 3).toUpperCase();
            }
        });

        new DataDisplay({
            element: block.getElementsByClassName("spell-save-dc")[0],
            getDefault: () => 8 + stats[ability.value].mod.value + proficiencyBonus.value,
            listenTo: [ability, ...Object.values(stats).map(s => s.mod), proficiencyBonus],
            editable: editable.never,
        });

        new DataDisplay({
            element: block.getElementsByClassName("spell-atk-bonus")[0],
            getDefault: () => stats[ability.value].mod.value + proficiencyBonus.value,
            listenTo: [ability, ...Object.values(stats).map(s => s.mod), proficiencyBonus],
            editable: editable.never,
            dataToString: signedIntToStr,
        });

        const delPage = block.getElementsByClassName("spellsheet-delete")[0];
        editingModeInputs.push(delPage);
        delPage.addEventListener("click", () => {
            characterData.spellcasting.splice(characterData.spellcasting.indexOf(dataObject), 1);
            block.remove();
        });

        for (let level = 0; level <= 9; level++) {
            const levelData = new SpellLevel(dataObject, level);
            
            const column = level <= 2 ? 0 : level <= 5 ? 1 : 2
            block.getElementsByClassName("spell-columns")[0].children[column].appendChild(levelData.block);
        }
    }

    static spellsPerLevel = [9, 13, 13, 13, 13, 9, 9, 9, 7, 7];
    static blank() {
        let r = {
            class: "",
            ability: "Intelligence",
            levels: [],
        };
        for (let level = 0; level <= 9; level++) {
            const o = r.levels[level] = { spells: [] };
            // if (level > 0) {
            //     o.spellSlots = { total: 0, expended: 0 };
            // }
            for (let spell = 0; spell < this.spellsPerLevel[level]; spell++) {
                o.spells.push({ name: "", prepared: false });
            }
        }
        return r;
    }
}

for (let i = 0; i < characterData.spellcasting.length; i++) {
    const sheet = new SpellSheet(i);
    document.getElementsByTagName("main")[0].appendChild(sheet.block);
}

newSpellSheetButton.addEventListener("click", () => {
    const sheet = new SpellSheet(characterData.spellcasting.push(SpellSheet.blank()) - 1);
    document.getElementsByTagName("main")[0].appendChild(sheet.block);
});
// #endregion

// #region Sharing
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
        const res = await fetch(characterJson, {
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
// #endregion

// #region edit403
if (!editPermission) {
    for (let element of alwaysEditing) {
        element.contentEditable = "false";
    }
    for (let element of [...alwaysEditingInputs, ...deathSaveBoxes, ...controlButtons.all]) {
        element.disabled = true;
    }
}
// #endregion