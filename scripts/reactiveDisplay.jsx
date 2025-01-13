import React from "./jsx.js";
import { characterApi, contentEditableValue } from "./globalConsts.js";
import { characterData, editPermission } from "./loadCharacter.js";

const newlineRegex = /[\n\r\u2028\u2029]/g;
const fontCtx = document.createElement("canvas").getContext("2d");

export const Editable = {
    ALWAYS: Symbol("Always Editable"),
    IN_EDITING_MODE: Symbol("In Editing Mode"),
    NEVER: Symbol("Never Editable"),
}

export const util = {
    betterParseInt(str) {
        if (/^[+\-]?\d+$/.test(str)) {
            return parseInt(str);
        }
        else 
            throw Error("Invalid int " + str);
    },
    unsignedParseInt(str) {
        if (/^\d+$/.test(str)) {
            return parseInt(str);
        }
        else 
            throw Error("Invalid int " + str);
    },
    signedIntToStr: n => n > 0 ? "+" + n : n,
};

export const editing = {
    isEditing: false,
    isSaving: false,
    ui: {
        editingMode: [],
        editingModeInputs: [],
        alwaysEditing: [],
        alwaysEditingInputs: [],
        special: [],
    },
    invalid: [],
    handlers: {
        beforeSave: () => {},
        afterSave: () => {},
    },
    async save() {
        this.isSaving = true;
        this.handlers.beforeSave();
        const res = await fetch(characterApi, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                property: "content",
                value: characterData
            }),
        });
        this.handlers.afterSave();
        if (!res.ok) {
            if (confirm(`Error attempting to save changes: "${res.status} - ${res.json().error}." Reload page (recommended)?`)) {
                location.reload();
            }
        }
        this.isSaving = false;
    },
    startEditing() {
        this.isEditing = true;
        document.body.dataset.editing = "true";
    
        for (let element of editing.ui.editingMode) {
            element.contentEditable = contentEditableValue;
        }
        for (let element of editing.ui.editingModeInputs) {
            element.disabled = false;
        }
    },
    stopEditing() {
        if (this.invalid.length !== 0) {
            alert("The character sheet contained invalid data and could not be saved");
            return;
        }
    
        this.isEditing = false;
        document.body.dataset.editing = "false";
    
        this.save();
    
        for (let element of editing.ui.editingMode) {
            element.contentEditable = "false";
        }
        for (let element of editing.ui.editingModeInputs) {
            element.disabled = true;
        }
        let changed = document.getElementsByClassName("changed");
        while (changed.length) {
            changed[0].classList.remove("changed");
        }
    },
    characterChanged() {
        if (!editing.isEditing) {
            this.save();
        }
    },
    viewOnlyMode() {
        for (let element of editing.ui.alwaysEditing) {
            element.contentEditable = "false";
        }
        for (let element of [...editing.ui.alwaysEditingInputs, ...editing.ui.special]) {
            element.disabled = true;
        }
    }
}
window.editing = editing;

if (!editPermission) {
    setTimeout(() => editing.viewOnlyMode(), 0);
}

export class DataDisplay {
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
        this.editable = args.editable ?? Editable.IN_EDITING_MODE;
        this.autoResize = args.autoResize ?? false;
        this.inCharacterSheet = args.inCharacterSheet ?? true;
        this.oldValue = Symbol("Original Value");
        const { listenTo = [] } = args;

        switch (this.editable) {
            case Editable.ALWAYS:
                this.element.editable = true;
                if (this.inCharacterSheet) {
                    editing.ui.alwaysEditing.push(this.element);
                }
                break;
            case Editable.IN_EDITING_MODE:
                if (this.inCharacterSheet) {
                    editing.ui.editingMode.push(this.element);
                }
                this.element.editable = editing.isEditing;
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
                if (range.startContainer === this.element.inner.childNodes[0] || range.startContainer === this.element.inner) {
                    range.deleteContents();
                    let content = event.clipboardData.getData("text/plain");
                    if (!this.allowNewlines) {
                        content = content.replace(newlineRegex, "");
                    }
                    range.insertNode(document.createTextNode(content));
                    range.collapse();
                    this.element.inner.normalize();

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
            this.element.inner.normalize();
            const selection = getSelection();
            const repeatedOffset = event.data ? event.data.replace(newlineRegex, "").length : 0;
            index = selection.getRangeAt(0).startOffset + repeatedOffset;
            for (let i = 0; i < selection.rangeCount; i++) {
                const range = selection.getRangeAt(i);
                if (range.startContainer === this.element.inner.childNodes[0]) {
                    index = range.startOffset + repeatedOffset;
                    break;
                }
            }
        });

        this.element.addEventListener("input", event => {
            if (!this.allowNewlines && newlineRegex.test(this.element.textValue)) {
                const brs = this.element.inner.getElementsByTagName("br");
                while (brs.length) {
                    brs[0].remove();
                }
                this.element.textValue = this.element.textValue.replace(newlineRegex, "");
                this.element.inner.normalize();
                const selection = getSelection();
                const node = this.element.inner.childNodes[0] ?? this.element.inner;
                for (let i = 0; i < selection.rangeCount; i++) {
                    const range = selection.getRangeAt(i);
                    if (range.startContainer === this.element.inner || range.startContainer === node) {
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
            if (this.getDefault?.() != null && this.element.textValue === "") {
                delete this.dataObject[this.property];
                doListeners = true;
            }
            else {
                const parse = this.parse(this.element.textValue);
                if (parse.isValid && this.dataObject[this.property] !== parse.value && (this.allowNewlines || !newlineRegex.test(this.element.textValue))) {
                    this.dataObject[this.property] = parse.value;
                    if (this.inCharacterSheet) {
                        editing.characterChanged();
                    }
                    doListeners = true;
                }
                else {
                    doListeners = false;
                }
            }
            this.element.inner.parentElement.scroll(0, 0);
            this.update(doListeners);
        });
        if (!this.allowNewlines) {
            this.element.addEventListener("keydown", event => {
                if (event.key === "Enter" && !(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)) {
                    this.element.inner.blur();
                }
            });
        }

        this.update();
    }

    listenTo(e) {
        e.addChangeListener(() => {
            if (editing.isEditing && this.valueExists) {
                this.element.classList.add("changed");
            }
            this.update()
        });
    }

    // TODO: This should be in UITextElement, not DataDisplay
    maybeResizeFont() {
        return;
        
    }

    checkElementValidity() {
        const parsed = this.parse(this.element.textValue);
        const actual = parsed.isValid;
        const display = actual || this.element.textValue === "" && (this.element.inner === document.activeElement || "default" in this.element.dataset);
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
        this.element.textValue = str;
        
        if (this.getDefault) {
            const defaultVal = this.getDefault();
            if (defaultVal === null) {
                delete this.element.dataset.default;
            }
            else {
                this.element.dataset.default = this.dataToString(defaultVal);
            }
        }

        if (this.inCharacterSheet) {
            const index = editing.invalid.indexOf(this);
            if (this.checkElementValidity().display) {
                if (index >= 0) {
                    editing.invalid.splice(index, 1);
                }
            }
            else {
                if (index === -1) {
                    editing.invalid.push(this);
                }
            }
        }

        this.maybeResizeFont();

        const changed = value !== this.oldValue;
        this.oldValue = value;

        if (doListeners && changed) {
            for (let listener of this.changeListeners) {
                listener(value, str, valueExists);
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

export class Fraction {
    constructor(numerArgs, denomArgs) {
        this.denomDisplay = new DataDisplay({
            element: this.denomElement,
            validate: n => n > 0,
            dataFromString: util.unsignedParseInt,
            ...denomArgs,
        });

        this.numerDisplay = new DataDisplay({
            element: this.numerElement,
            validate: n => n >= 0 && n <= this.denomDisplay.value,
            dataFromString: util.unsignedParseInt,
            listenTo: [ this.denomDisplay ],
            editable: Editable.ALWAYS,
            ...numerArgs,
        });
    }
}

export class List {
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

export class ListItem {
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