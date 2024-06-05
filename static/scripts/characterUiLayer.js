const testElement = document.createElement("div");
testElement.setAttribute("contentEditable", "PLAINTEXT-ONLY");
const supportsPlaintextOnly = testElement.contentEditable === "plaintext-only";
export const contentEditableValue = supportsPlaintextOnly ? "plaintext-only" : "true";

const initialInnerElement = Symbol("Initial Element")
export const isUiElement = Symbol("Is UI Element?");

/* To Add:
- Add Style Class
- Add Event Listener
- Set/get .dataset.default
- Change content?
*/
export class UIElement {
    storageElement = document.createElement("div");
    storageObserver = new MutationObserver((mutationList, observer) => {

    });
    [isUiElement] = true;

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
        if (this.isUnset) {
            this.editableValue = "disabled" in this.inner ? !this.inner.disabled : this.inner.contentEditable;
        }
        else {
            for (let prop of ["editable"]) {
                this[prop] = this[prop];
            }
            for (let {type, listener} of this.eventListeners) {
                this.inner.removeEventListener(type, listener);
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

export const theme = {

}