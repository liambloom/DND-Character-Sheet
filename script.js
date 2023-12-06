const characterJson = "characters" + new URL(location).pathname + ".json";

(async function() {
    const charResponse = await fetch(characterJson);
    const characterData = await charResponse.json();
    const character = {};

    function save() {
        fetch(characterJson, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(characterData),
        });
    }

    document.getElementById("save").addEventListener("click", save);

    document.title = characterData.name + " Character Sheet";
    document.getElementById("name").innerText = characterData.name;

    class CalculatedDataDisplay {
        constructor({element, dataObject = characterData, property, getValue = () => dataObject[property], dataToString = v => v}) {
            this.changeListeners = [];
            this.element = element;
            this.getValue = () => dataToString(getValue());
            this.update();
        }

        get value() {
            return this.getValue();
        }

        // TODO add setter

        update() {
            const value = this.element.innerText = this.value;
            for (let listener of this.changeListeners) {
                listener(value);
            }
        }

        addChangeListener(callback) {
            this.changeListeners.push(callback);
        }

        removeChangeListener(callback) {
            this.changeListeners.splice(this.changeListeners.indexOf(callback));
        }
    }

    class EditableDataDisplay extends CalculatedDataDisplay {
        constructor(args) {
            super(args);
            const { validate, setValue = v => dataObject[property] = v, dataFromString = v => v, validElement = args.element, allowNewlines = true } = args;
            this.setValue = v => dataFromString(setValue(v));
            this.validate = validate;
            this.validElement = validElement;
            this.allowNewlines = allowNewlines;

            this.element.addEventListener("input", () => {
                if (this.element.innerText === "" || this.validate(this.element.innerText)) {
                    this.validElement.classList.remove("invalid");
                }
                else {
                    this.validElement.classList.add("invalid");
                }
            })

            this.element.addEventListener("blur", this.update);
            if (!this.allowNewlines) {
                this.element.addEventListener("keydown", event => {
                    if (event.key === "Enter" && !(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)) {
                        this.element.blur();
                    }
                });
            }

            updateDisplay();
        }

        update() {
            this.validElement.classList.remove("invalid");
            if (validate(this.element.innerText)) {
                this.setValue(fromString(this.element.innerText));
            }
            super.update();
        }


        set value(v) {
            this.setValue(v);
            super.update();
        }
    }

    class MultipleDisplay {
        constructor(...displays) {
            this.displays = displays;
        }
    }

    for (let stat in characterData.stats) {
        const block = document.getElementById(stat);

        linkElementData({
            element: block.getElementsByClassName("stat-val")[0], 
            validate: txt => /^(?:20|1?\d)$/.test(txt), 
            dataObject: characterData.stats, 
            property: stat, 
            fromString: parseInt,
            validElement: block, 
            allowNewlines: false, 
            alsoOnChange: () => {
                let mod = Math.floor((characterData.stats[stat] - 10) / 2);
                if (mod > 0) {
                    mod = "+" + mod;
                }
                block.getElementsByClassName("stat-mod")[0].innerText = mod;
            }
        });
    }

    linkElementData({
        element: document.getElementById("current-hp"),
        validate: n => /\d+/.test(n) && parseInt(n) <= characterData.maxHp,
        property: "hp",
        fromString: parseInt,
        allowNewlines: false,
    });
    linkElementData({
        element: document.getElementById("max-hp"),
        validate: n => /[1-9]\d*/.test(n),
        property: "maxHp",
        fromString: parseInt,
        allowNewlines: false,
        alsoOnChange: () => {
            if (characterData.hp > characterData.maxHp) {
                characterData.hp = characterData.maxHp;
                document.getElementById("current-hp").innerText = characterData.hp;
            }
        },
    });
})()