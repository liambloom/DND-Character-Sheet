// #region React

// https://stackoverflow.com/a/42405694/11326662
const React = {
    createElement: function (tag, attrs, children) {
        var element = document.createElement(tag);

        for (let name in attrs) {
            if (name && attrs.hasOwnProperty(name)) {
                let value = attrs[name];
                if (value === true) {
                    element.setAttribute(name, name);
                } else if (value !== false && value != null) {
                    element.setAttribute(name, value.toString());
                }
            }
        }
        for (let i = 2; i < arguments.length; i++) {
            let child = arguments[i];
            element.appendChild(
                child.nodeType == null ?
                    document.createTextNode(child.toString()) : child);
        }
        return element;
    }
};
// #endregion

// #region Constants
const characterJson = "characters" + new URL(location).pathname + ".json";

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
    "rouge": 8,
    "warlock": 8,
    "fighter": 10,
    "paladin": 10,
    "ranger": 10,
    "barbarian": 12,
};

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

const savingIndicator = document.getElementById("saving");
async function save() {
    saving = true;
    savingIndicator.style.display = "initial";
    const res = await fetch(characterJson, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(characterData),
    });
    savingIndicator.style.display = "none";
    if (!res.ok) {
        if (confirm(`Error attempting to save changes: "${res.status} - ${res.statusText}." Reload page (recommended)?`)) {
            location.reload();
        }
    }
    saving = false;
}
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
        const { listenTo = [] } = args;

        switch (this.editable) {
            case editable.always:
                this.element.contentEditable = contentEditableValue;
                alwaysEditing.push(this.element);
                break;
            case editable.inEditingMode:
                editingMode.push(this.element);
                this.element.contentEditable = editing ? contentEditableValue : "false";
                break;
        }

        for (let e of listenTo) {
            e.addChangeListener(() => {
                if (editing && this.getDefault && this.valueExists) {
                    this.element.classList.add("changed");
                }
                this.update()
            });
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

        this.element.addEventListener("input", () => {
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
                    characterChanged();
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
            const val = this.dataFromString(v);
            return {
                isValid: this.validate(val) && (typeof val !== "number" || val < Number.MAX_SAFE_INTEGER),
                value: val,
            };
        }
        catch (e) {
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
        
        if (this.getDefault) {
            const defaultVal = this.getDefault();
            if (defaultVal === null) {
                delete this.element.dataset.default;
            }
            else {
                this.element.dataset.default = this.dataToString(defaultVal);
            }
        }
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

        this.maybeResizeFont();

        if (doListeners) {
            for (let listener of this.changeListeners) {
                listener(value, str, valueExists);
            }
        }
    }

    addChangeListener(callback) {
        this.changeListeners.push(callback);
    }

    removeChangeListener(callback) {
        this.changeListeners.splice(this.changeListeners.indexOf(callback));
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
// #endregion

// #region Fetch character data
const charResponse = await fetch(characterJson);
const characterData = await charResponse.json();
window.characterData = characterData;

for (let skill of characterData.skills.proficiencies) {
    if (!(skill in skillToStatMap)) {
        alert("The character sheet is invalid");
        throw new Error(`Cannot have proficiency in ${skill} because no such skill exists`);
    }
}
// #endregion

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
        validate: n => n > 0 && n <= 20,
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
}
const totalHitDice = new DataDisplay({
    ...hitDiceArgs,
    element: document.getElementById("hit-dice-total"),
    property: "hitDiceTotal",
    validate: val => val.map(({n}) => n).reduce((sum, v) => sum + v) === classAndLvl.characterLevel,
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

const deathSaveBoxes = Array.from(document.getElementById("death-saves").getElementsByTagName("input"));
const killButton = document.getElementById("kill");

function die() {
    if (!characterData.dead) {
        characterData.dead = true;

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
    for (let element of [...alwaysEditingInputs, ...deathSaveBoxes, editButton, killButton]) {
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
    for (let element of [...alwaysEditingInputs, editButton, killButton]) {
        element.disabled = false;
    }
}

document.getElementById("revive").addEventListener("click", revive);
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
    });
    otherProficiencies.push(display);
}

const attacksText = new DataDisplay({
    element: document.getElementById("attacks-text"),
    property: "attacksText",
    allowNewlines: true,
});

const weaponsTable = document.getElementById("attacks-table");
const addWeapon = document.getElementById("attacks-add");
const weapons = [];

class Weapon {
    constructor(weapon) {
        const block = this.element = <div class="attacks-row">
            <div class="list-move">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <button class="list-delete" type="button"><img src="./img/trash.png"></img></button>
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
            }),
            damage: new DataDisplay({
                element: block.getElementsByClassName("weapon-damage-value")[0],
                dataObject: weapon,
                property: "damage",
                dataToString: data => {
                    let str = "";

                    for (let amt of data.amount) {
                        if (typeof amt === "number") {
                            if (str.length) {
                                str += (amt < 0 ? "-" : "+")
                                str += Math.abs(amt);
                            }
                            else {
                                str += amt;
                            }
                        }
                        else {
                            if (str.length) {
                                str += "+";
                            }
                            str += hitDieToString(amt);
                        }
                    }

                    if (data.type) {
                        str += " " + data.type;
                    }

                    return str;
                },
                dataFromString: str => {
                    let [ amountStr, type, err ] = str.split(/\s/g);

                    if (!amountStr || type && !type.length || err !== undefined) {
                        throw new Error();
                    }

                    let arr = amountStr.split(/\+|(?=-)/g);
                    if (arr[0].length === 0) {
                        arr.pop();
                        arr[0] = amountStr.charAt(0) + arr[0]
                    }

                    let amount = [];

                    for (let value of arr) {
                        try {
                            amount.push(betterParseInt(value));
                        }
                        catch {
                            amount.push(hitDieFromString(value));
                        }
                    }

                    return { amount, type };
                },
                validate: dat => dat.amount.length > 0,
            }), 
        };

        block.getElementsByClassName("list-delete")[0].addEventListener("click", () => {
            block.remove();
            const index = weapons.indexOf(this);
            weapons.splice(index, 1);
            characterData.weapons.splice(index, 1);
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

                if (this === weapons[0] && dy < 0) {
                    dy = 0;
                }
                if (this === weapons[weapons.length - 1] && dy > 0) {
                    dy = 0;
                }

                block.style.setProperty("translate", `0 ${dy}px`);

                const midpoint = block.offsetTop + block.clientHeight / 2 + dy;
                let colliding;
                let collidingIndex;
                for (let i = 0; i < weapons.length; i++) {
                    const otherWeapon = weapons[i];
                    if (this === otherWeapon) {
                        continue;
                    }

                    if (otherWeapon.element.offsetTop <= midpoint && midpoint <= otherWeapon.element.offsetTop + otherWeapon.element.clientHeight) {
                        colliding = otherWeapon;
                        collidingIndex = i;
                        break;
                    }
                }

                if (colliding) {
                    console.log("move");
                    const ownIndex = weapons.indexOf(this);
                    const prevY = block.offsetTop;

                    block.remove();
                    if (ownIndex > collidingIndex) {
                        weaponsTable.insertBefore(block, colliding.element);
                    }
                    else {
                        weaponsTable.insertBefore(block, colliding.element.nextElementSibling);
                    }

                    weapons.splice(ownIndex, 1);
                    weapons.splice(collidingIndex, 0, this);

                    console.log(weapons);

                    const jsonValue = characterData.weapons[ownIndex];
                    characterData.weapons.splice(ownIndex, 1);
                    characterData.weapons.splice(collidingIndex, 0, jsonValue);

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

        weaponsTable.insertBefore(block, addWeapon);
    }
}

for (let weapon of characterData.weapons) {
    weapons.push(new Weapon(weapon));
}

addWeapon.addEventListener("click", () => {
    const data = { name: "Name", bonus: 0, damage: { amount: [0], type: "type" } };
    weapons.push(new Weapon(data));
    characterData.weapons.push(data);
});

// #endregion