import { statNames, moneyDenominations, skillNames } from "./5eData.js";

const testElement = document.createElement("div");
testElement.setAttribute("contentEditable", "PLAINTEXT-ONLY");
const supportsPlaintextOnly = testElement.contentEditable === "plaintext-only";
export const contentEditableValue = supportsPlaintextOnly ? "plaintext-only" : "true";

const initialInnerElement = Symbol("Initial Element")
export const isUiElement = Symbol("Is UI Element?");

let theme;

class CustomDOMTokenList {
    values = new Set();

    add(...tokens) {
        for (let t of tokens) {
            this.toggle(t, true);
        }
    }

    remove(...tokens) {
        for (let t of tokens) {
            this.toggle(t, false)
        }
    }

    contains(token) {
        return this.values.has(token);
    }

    toggle(token, force) {
        if (force ?? !this.values.contains(token)) {
            if (this.innerElement.classList.contains(token)) {
                throw new Error(`Overlap between UI Layer class and theme class ${token} on element `, e);
            }
            this.values.add(token);
            this.innerElement.classList.add(token);

        }
        else {
            this.values.delete(token);
            this.innerElement.classList.remove(token);
        }
    }

    set element(element) {
        if (this.innerElement) {
            this.innerElement.classList.remove(...values);
        }
        this.innerElement = element;
        this.innerElement.classList.add(...values);
    }
}

/* To Add:
- Set/get .dataset.default
- Change content?
*/
class UISimpleElement {
    [isUiElement] = true;
    classList = new CustomDOMTokenList();

    constructor() {
        this.inner = initialInnerElement;
    }

    innerValue = initialInnerElement;

    get isUnset() {
        return this.innerValue === initialInnerElement;
    }

    get inner() {
        return this.isUnset ? null : this.innerValue;
    }

    set inner(value) {
        const isInitial = this.isUnset;
        if (!isInitial) {
            for (let {type, listener} of this.eventListeners) {
                this.inner.removeEventListener(type, listener);
            }
        }
        this.innerValue = value;
        this.classList.element = this.inner;
        if (isInitial) {
            this.editableValue = "disabled" in this.inner ? !this.inner.disabled : this.inner.contentEditable;
        }
        else {
            for (let prop of ["editable"]) {
                this[prop] = this[prop];
            }
            for (let {type, listener} of this.eventListeners) {
                this.inner.addEventListener(type, listener);
            }
        }
    }

    get editable() {
        return this.editableValue;
    }

    set editable(value) {
        if ("disabled" in this.inner) {
            this.inner.disabled = !value;
        }
        else {
            this.inner.contentEditable = value ? contentEditableValue : false;
        }
    }

    eventListeners = [];

    addEventListener(type, listener) {
        this.eventListeners.push({type, listener});
        if (!this.isUnset) {
            this.inner.addEventListener(type, listener);
        }        
    }
}

class UITextElement extends UISimpleElement {
    get textValueProp() {
        return this.inner instanceof HTMLInputElement || this.inner instanceof HTMLTextAreaElement ? "value" : "innerText";
    }

    get textValue() {
        return this.inner[this.textValueProp];
    }

    set textValue(value) {
        this.inner[this.textValueProp] = value;
    }

    set inner(value) {
        const isInitial = this.isUnset;
        const oldTextValue = isInitial ? null : this.textValue;
        super.inner = value;
        if (!isInitial) {
            this.textValue = oldTextValue;
        }
    }
}

class UIBooleanElement extends UISimpleElement {
    get boolValue() {
        return this.inner.checked;
    }

    set boolValue(value) {
        this.inner.checked = value;
    }

    set inner(value) {
        const isInitial = this.isUnset;
        const oldBoolValue = isInitial ? null : this.boolValue;
        super.inner = value;
        if (!isInitial) {
            this.boolValue = oldBoolValue;
        }
    }
}

class UIListElement {
    [isUiElement] = true;
    addButton = UISimpleElement();

    constructor(listItemType) {
        this.listItemType = listItemType;
        this.addButton.addEventListener("click", () => {

        });
    }

    get ListItem() {
        return theme.templates[listItemType];
    }

    get inner() {
        return this.innerValue;
    }

    set inner(value) {

        this.innerValue = value;
        this.addButton.inner = this.inner.querySelector("[data-list-add-button]");

    }
}

function textListUiBuilder(content, ElType = UITextElement) {
    return Object.fromEntries(content.map(k => {k, new ElType()}));
}

function proficiencyUiBuilder(props) {
    return Object.fromEntries(props.map(p => [p, { proficiencyCheckbox: new UIBooleanElement(), bonus: new UITextElement()}]))
}

export const ui = {
    ...textListUiBuilder("name", "classAndLevel", "background", "playerName",
    "race", "xp", "proficiencyBonus", "ac", "initiative", "speed", "attackText","equipmentText"),
    inspiration: new UIBooleanElement(),
    stats: Object.fromEntries(statNames.map(stat => 
        [stat, { value: new UITextElement(), modifier: new UITextElement() }])),
    savingThrows: proficiencyUiBuilder(statNames),
    skills: proficiencyUiBuilder(skillNames),
    otherProficiencies: textListUiBuilder("armor", "weapons", "tools", "languages"),
    hp: textListUiBuilder("current", "max", "temp"),
    hitDice: textListUiBuilder("current", "max"),
    money: textListUiBuilder(moneyDenominations),
    // deathSaves = { success: [bool, bool, bool], fail: (same) }
    deathSaves: Object.fromEntries(["success", "fail"].map(k => 
        [k, Array.apply(null, Array(3)).map(() => new UIBooleanElement())])),
    features: new UIListElement("Feature"),
    weapons: new UIListElement("Weapon"),
}

function getUiElements(root, path) {
    if (Array.isArray(root)) {
        return root.flatMap((e, i) => getUiElements(e, `${path}[${i}]`));
    }
    else if (root[isUiElement]) {
        root.name = path;
        return [root];
    }
    else if (typeof root === object) {
        return Object.entries(root).flatMap(([k, v]) => getUiElements(v, `${path}.${k}`));
    }
    else {
        return [];
    }
}

const uiElements = getUiElements(ui, "");

for (let e of uiElements) {
    if (e.name.charAt(0) === ".") {
        e.name = e.name.substring(1);
    }
}

export function setTheme(newTheme) {
    theme = newTheme;
    for (let e of uiElements) {
        const domElements = [...theme.mainContent.querySelector(`[data-character="${e.name}"]`)];
        e.inner = domElements.find(e => e.dataset.mirrorType !== "readonly")
    }
}