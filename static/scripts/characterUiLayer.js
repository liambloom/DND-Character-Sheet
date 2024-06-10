import { statNames, moneyDenominations, skillNames } from "./5eData.js";

const testElement = document.createElement("div");
testElement.setAttribute("contentEditable", "PLAINTEXT-ONLY");
const supportsPlaintextOnly = testElement.contentEditable === "plaintext-only";
export const contentEditableValue = supportsPlaintextOnly ? "plaintext-only" : "true";

const initialInnerElement = Symbol("Initial Element")
export const isUiElement = Symbol("Is UI Element?");

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
export class UITextElement {
    [isUiElement] = true;
    classList = new CustomDOMTokenList();

    constructor(inner = initialInnerElement) {
        this.inner = inner;
    }

    innerValue = initialInnerElement;

    get isUnset() {
        return this.innerValue === initialInnerElement;
    }

    get inner() {
        return this.isUnset ? null : this.innerValue;
    }

    set inner(value) {
        if (!this.isUnset) {
            for (let {type, listener} of this.eventListeners) {
                this.inner.removeEventListener(type, listener);
            }
        }
        this.innerValue = value;
        this.classList.element = this.inner;
        if (this.isUnset) {
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
        this.inner.addEventListener(type, listener);
    }
}

class UIBooleanElement {

}

export function setTheme(theme) {

}

function textListUiBuilder(ElType, content) {
    return Object.fromEntries(content.map(k => {k, new ElType()}));
}

function proficiencyUiBuilder(props) {
    return Object.fromEntries(props.map(p => [p, { proficiencyCheckbox: new UIBooleanElement(), bonus: new UITextElement()}]))
}

export const ui = {
    ...textListUiBuilder(UITextElement, "name", "classAndLevel", "background", "playerName",
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

    // featuresList: {
    //     listElement,
    //     addButton
    // }
    // weaponsList
}