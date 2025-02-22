import { statNames, moneyDenominations, skillNames, contentEditableValue } from "./globalConsts.js";

const initialInnerElement = Symbol("Initial Element")
export const isUiElement = Symbol("Is UI Element?");

let theme;

const themeChangeListeners = [];

export function addThemeChangeListener(listener) {
    themeChangeListeners.push(listener);
}

export function removeThemeChangeListener(listener) {
    const i = themeChangeListeners.indexOf(listener);
    if (i !== -1) {
        themeChangeListeners.splice(i, 1);
    }
}

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
            this.innerElement.classList.remove(...this.values);
        }
        this.innerElement = element;
        console.debug(element);
        this.innerElement.classList.add(...this.values);
    }
}

/* To Add:
- Change content?
*/
class UISimpleElement {
    [isUiElement] = true;
    classList = new CustomDOMTokenList();
    innerDataset = {};

    constructor() {
        const self = this;
        this.dataset = new Proxy(this.innerDataset, {
            set(target, key, value) {
                self.inner.dataset[key] = value;
                return Reflect.set(...arguments);
            }
        });
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
            for (let key in this.dataset) {
                delete this.inner.dataset[key];
            }
        }
        this.innerValue = this.classList.element = value;
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
            for (let [key, value] of Object.entries(this.dataset)) {
                this.inner.dataset[key] = value;
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
    constructor() {
        super();
        this.addEventListener("input", () => {
            setTimeout(() => this.onValueChanged(), 0);
        });
    }

    get textValueProp() {
        return this.inner instanceof HTMLInputElement || this.inner instanceof HTMLTextAreaElement ? "value" : "innerText";
    }

    get textValue() {
        return this.inner[this.textValueProp];
    }

    set textValue(value) {
        this.inner[this.textValueProp] = value;
        this.onValueChanged();
    }

    get inner() {
        return super.inner;
    }

    set inner(value) {
        const isInitial = this.isUnset;
        const oldTextValue = isInitial ? null : this.textValue;
        super.inner = value;
        if (!isInitial) {
            this.textValue = oldTextValue;
        }
    }

    onValueChanged() {
        if (this.dataset.autoScaleFont) {
            // TODO: inputLine is theme specific
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
}

class UIBooleanElement extends UISimpleElement {
    get boolValue() {
        return this.inner.checked;
    }

    set boolValue(value) {
        this.inner.checked = value;
    }

    get inner() {
        return super.inner;
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

class UIList {
    [isUiElement] = true;
    addButton = new UISimpleElement();
    content = [];

    constructor(listItemType) {
        this.listItemType = listItemType;
        const self = this;
        this.addButton.addEventListener("click", () => {
            self.addListItem();
        });
    }

    addListItem(itemData = null) {
        const item = new UIListItem(this);
        const i = this.content.push(item);
        this.hooks.itemAdded(i - 1, item, itemData);
        this.inner.insertBefore(item.inner, this.addButton.inner);
    }

    removeListItem(index) {
        this.content.splice(index, 1);
        this.inner.remove();
        this.hooks.itemRemoved(index);
    }

    setInitialContent(content) {
        for (let itemData of content) {
            this.addListItem(itemData);
        }
    }

    get inner() {
        return this.innerValue;
    }

    set inner(value) {

        this.innerValue = value;
        this.addButton.inner = this.inner.querySelector("[data-list-add-button]");
        for (let item of this.content) {
            item.inner = new theme.templates[this.listItemType]();
            this.inner.insertBefore(item.inner)
        }
    }

    hooks = {}
}

function setUiValues(src, out, keys) {
    for (let key of keys) {
        out[key].inner = src[key];
    }
}

class UIListItem {
    dyInner = 0;

    constructor(list) {
        this.list = list;
        const type = list.listItemType;

        this.element = new UISimpleElement();
        this.deleteButton = new UISimpleElement();
        this.moveHandle = new UISimpleElement();
        if (type === "Weapon") {
            this.data = textListUiBuilder("name", "bonus", "damage");
        }
        else { // type === "Feature"
            this.data = {
                ...textListUiBuilder("name", "text", "currentUses", "maxUses"),
                checkbox: new UIBooleanElement(),
            }
        }

        this.deleteButton.addEventListener("click", () => {
            list.removeListItem(this.index);
        });

        let dragging = false;
        let startY;
        this.moveHandle.addEventListener("mousedown", e => {
            dragging = true;
            this.element.classList.add("dragging");
            document.body.classList.add("dragHappening");
            startY = e.screenY;
        });
        window.addEventListener("mousemove", e => {
            if (dragging) {
                let dy = e.screenY - startY;
                if (this.index === 0 && dy < 0 || this.index + 1 === this.list.content.length && dy > 0) {
                    dy = 0;
                }

                this.dy = dy;

                let colliding;
                let collidingIndex;
                for (let i = 0; i < this.list.contents.length; i++) {
                    const other = this.list.contents[i];
                    if (this === other) {
                        continue;
                    }

                    if (other.top <= this.midpoint && this.midpoint <= other.bottom && this.top <= other.midpoint && other.midpoint <= this.bottom) {
                        colliding = other;
                        break;
                    }
                }

                if (colliding) {
                    const prevY = this.element.inner.offsetTop;
                    const prevIndex = this.index;
                    const prevCollidingIndex = colliding.index;

                    this.element.inner.remove();
                    if (this.index > colliding.index) {
                        this.list.element.insertBefore(this.element.inner, colliding.element.inner);
                    }
                    else {
                        list.element.insertBefore(this.element.inner, colliding.element.inner.nextElementSibling);
                    }


                    this.list.contents.splice(prevIndex, 1);
                    this.list.contents.splice(prevCollidingIndex, 0, this);

                    startY += this.element.inner.offsetTop - prevY;
                    this.dy = e.screeY - startY;

                    this.list.hooks.itemMoved(prevIndex, this.index);
                }
            } 
        });
        function endDrag() {
            dragging = false;
            this.element.classList.remove("dragging");
            document.body.classList.remove("dragHappening");
            this.dy = 0;
        }
        
        window.addEventListener("mouseup", endDrag);
        window.addEventListener("mouseleave", endDrag);
        addThemeChangeListener(endDrag);


        this.inner = new theme.templates[type]();
    }

    get dy() {
        return this.dyInner;
    }

    set dy(value) {
        this.element.inner.style.setProperty("translate", `0 ${dy}px`);
        this.dyInner = value;
    }

    get index() {
        return this.list.contents.indexOf(this);
    }

    get top() {
        return this.element.inner.offsetTop + (this.dy ?? 0);
    }

    get midpoint() {
        return this.top + this.element.inner.clientHeight / 2;
    }

    get bottom() {
        return this.top + this.element.clientHeight;
    }

    get inner() {
        return this.innerValue;
    }

    set inner(value) {
        setUiValues(value, this, ["element", "deleteButton", "moveHandle"]);
        setUiValues(value.data, this.data, Object.keys(this.data));
    }
}

function textListUiBuilder(...content) {
    return Object.fromEntries(content.map(k => [k, new UITextElement()]));
}

function proficiencyUiBuilder(props) {
    return Object.fromEntries(props.map(p => [p, { proficiencyCheckbox: new UIBooleanElement(), bonus: new UITextElement()}]))
}

export const ui = {
    ...textListUiBuilder("name", "classAndLevel", "background", "playerName",
    "race", "xp", "proficiencyBonus", "ac", "initiative", "speed", "attacksText","equipmentText"),
    inspiration: new UIBooleanElement(),
    stats: Object.fromEntries(statNames.map(stat => 
        [stat, { value: new UITextElement(), modifier: new UITextElement() }])),
    savingThrows: proficiencyUiBuilder(statNames),
    skills: proficiencyUiBuilder(skillNames),
    passiveSkills: textListUiBuilder(...skillNames),
    otherProficiencies: textListUiBuilder("armor", "weapons", "tools", "languages"),
    hp: textListUiBuilder("current", "max", "temp"),
    hitDice: textListUiBuilder("current", "max"),
    money: textListUiBuilder(...moneyDenominations),
    // deathSaves = { success: [bool, bool, bool], fail: (same) }
    deathSaves: Object.fromEntries(["success", "fail"].map(k => 
        [k, Array.apply(null, Array(3)).map(() => new UIBooleanElement())])),
    features: new UIList("Feature"),
    weapons: new UIList("Weapon"),
}

function getUiElements(root, path) {
    if (Array.isArray(root)) {
        return root.flatMap((e, i) => getUiElements(e, `${path}[${i}]`));
    }
    else if (root[isUiElement]) {
        root.name = path;
        return [root];
    }
    else if (typeof root === "object") {
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
        const domElements = [...theme.mainContent.querySelectorAll(`[data-character="${e.name}"]`)];
        e.inner = domElements.find(e => e.dataset.mirrorType !== "readonly") ?? document.createElement("div");
    }
    for (let listener of themeChangeListeners) {
        listener();
    }

    const newMain = document.createElement("main");
    newMain.id = "main";
    newMain.appendChild(newTheme.mainContent);
    document.getElementById("main").replaceWith(newMain)
}