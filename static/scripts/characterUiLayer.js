const testElement = document.createElement("div");
testElement.setAttribute("contentEditable", "PLAINTEXT-ONLY");
const supportsPlaintextOnly = testElement.contentEditable === "plaintext-only";
export const contentEditableValue = supportsPlaintextOnly ? "plaintext-only" : "true";

const initialInnerElement = Symbol("Initial Element")

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

    constructor(inner) {
        this.inner = inner;
    }

    innerValue = initialInnerElement;

    get inner() {
        return this.innerValue;
    }

    set inner(value) {
        let first = this.inner === initialInnerElement;
        if (!first) {
            for (let {type, listener} of this.eventListeners) {
                this.inner.removeEventListener(type, listener);
            }
        }
        this.innerValue = value;
        if (first) {
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