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
        alwaysEditing: [],
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
        console.log("start editing");
        this.isEditing = true;
        document.body.dataset.editing = "true";
    
        for (let element of editing.ui.editingMode) {
            element.editable = true;
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
            element.editable = false;
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
            element.editable = false;
        }
        for (let element of [...editing.ui.special]) {
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
        let publicValue, publicValueString;
        
        if (this.getDefault) {
            const defaultVal = this.getDefault();
            if (defaultVal === null) {
                delete this.element.dataset.default;
            }
            else {
                // this.element.dataset.default = this.dataToString(defaultVal);
                publicValue = defaultVal;
                publicValueString = this.element.dataset.default = this.dataToString(defaultVal);
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

        if (valueExists) {
            publicValue = value;
            publicValueString = str;
        }

        const changed = publicValue !== this.oldValue;
        this.oldValue = publicValue;

        // const changed = value !== this.oldValue;
        // this.oldValue = value;

        if (doListeners && changed) {
            for (let listener of this.changeListeners) {
                // listener(value, str, valueExists);
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

export class Fraction {
    constructor(numerArgs, denomArgs) {
        this.denomDisplay = new DataDisplay({
            validate: n => n > 0,
            dataFromString: util.unsignedParseInt,
            ...denomArgs,
        });

        this.numerDisplay = new DataDisplay({
            validate: n => n >= 0 && n <= this.denomDisplay.value,
            dataFromString: util.unsignedParseInt,
            listenTo: [ this.denomDisplay ],
            editable: Editable.ALWAYS,
            ...numerArgs,
        });
    }
}