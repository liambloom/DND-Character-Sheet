const characterJson = "characters" + new URL(location).pathname + ".json";

let editing = false;
const newlineRegex = /[\n\r\u2028\u2029]/g;
const statNames = ["str", "dex", "con", "int", "wis", "cha"];
const statFullNames = {
    "str": "Strength",
    "dex": "Dexterity",
    "con": "Constitution",
    "int": "Intelligence",
    "wis": "Wisdom",
    "cha": "Charisma",
};

const editable = {
    always: Symbol(),
    inEditingMode: Symbol(),
    never: Symbol(),
}
const editingMode = [];
const editingModeInputs = [];
const invalid = [];

const testElement = document.createElement("div");
testElement.setAttribute("contentEditable", "PLAINTEXT-ONLY");
const supportsPlaintextOnly = testElement.contentEditable === "plaintext-only";
const contentEditableValue = supportsPlaintextOnly ? "plaintext-only" : "true";

function betterParseInt(str) {
    if (/^(?:\+|-)?\d+$/.test(str)) {
        return parseInt(str);
    }
    else 
        throw Error("Invalid int " + str);
}

const signedIntToStr = n => n > 0 ? "+" + n : n;

(async function() {
    const charResponse = await fetch(characterJson);
    const characterData = await charResponse.json();
    window.characterData = characterData;

    function save() {
        fetch(characterJson, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(characterData),
        });
    }

    function startEditing() {
        editing = true;

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

        save();

        for (let element of editingMode) {
            element.contentEditable = "false";
        }
        for (let element of editingModeInputs) {
            element.disabled = true;
        }
        for (let element of document.getElementsByClassName("changed")) {
            element.classList.remove("changed");
        }
    }

    function characterChanged() {
        if (!editing) {
            save();
            console.log("Saving...");
        }
    }

    document.getElementById("save").addEventListener("click", stopEditing);
    document.getElementById("edit").addEventListener("click", startEditing);

    class DataDisplay {
        constructor(args) {
            this.changeListeners = [];
            this.invalidationListeners = [];
            this.element = args.element;
            this.dataObject = args.dataObject || characterData;
            this.property = args.property;
            this.getValue = args.getValue || (() => this.dataObject[this.property]);
            this.dataToString = args.dataToString || (v => "" + v);
            this.dataFromString = args.dataFromString || (v => v);
            this.validate = args.validate || (() => true);
            this.allowNewlines = args.allowNewlines || false;
            this.getDefault = args.getDefault;
            this.editable = args.editable || editable.inEditingMode;
            const { listenTo = [] } = args;

            switch (this.editable) {
                case editable.always:
                    this.element.contentEditable = contentEditableValue;
                    break;
                case editable.inEditingMode:
                    editingMode.push(this.element);
                    this.element.contentEditable = "false";
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
                    if (range.startContainer === this.element.childNodes[0]) {
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

            this.element.addEventListener("input", event => {
                if (!this.allowNewlines && newlineRegex.test(this.element.innerText)) {
                    for (let element of this.element.getElementsByTagName("br")) {
                        element.remove();
                    }
                    this.element.innerText = this.element.innerText.replace(newlineRegex, "");
                    this.element.normalize();
                    const selection = getSelection();
                    const node = this.element.childNodes[0] || this.element;
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
                if (this.getDefault && this.element.innerText === "") {
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
                this.update(doListeners)
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

        checkElementValidity() {
            const parsed = this.parse(this.element.innerText);
            const actual = parsed.isValid;
            const display = actual || this.element.innerText === "";
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
                    isValid: this.validate(val),
                    value: val,
                };
            }
            catch (e) {
                return { isValid: false };
            }
        }

        get value() {
            return this.getValue() || this.getDefault();
        }

        get valueExists() {
            return !this.dataObject || this.property in this.dataObject;
        }

        update(doListeners = true) {
            const valueExists = this.valueExists;
            const value = valueExists ? this.value : undefined;
            const str = valueExists ? this.dataToString(this.value) : undefined
            if (valueExists) {
                this.element.innerText = str;
            }

            if (doListeners) {
                for (let listener of this.changeListeners) {
                    listener(value, str, valueExists);
                }
            }          
            if (this.getDefault) {
                this.element.dataset.default = this.dataToString(this.getDefault());
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

    const name = new DataDisplay({
        element: document.getElementById("name"),
        property: "name",
    });
    name.addChangeListener((_, str) => document.title = str + " Character Sheet");
    
    document.title = characterData.name + " Character Sheet";

    const stats = {};

    for (let statName of statNames) {
        const block = <div class="stat" id={statName}>
            <div class="stat-val ignore-invalid"></div>
            <div class="stat-mod inherit-invalid"></div>
        </div>
        document.getElementById("stats").appendChild(block);

        stats[statName] = {};
        const stat = stats[statName].stat = new DataDisplay({
            element: block.getElementsByClassName("stat-val")[0],
            validate: n => n > 0 && n <= 20,
            dataObject: characterData.stats, 
            property: statName, 
            dataFromString: betterParseInt,
        });
        const mod = stats[statName].mod = new DataDisplay({
            element: block.getElementsByClassName("stat-mod")[0],
            getDefault: () => Math.floor((stat.value - 10) / 2),
            dataToString: signedIntToStr,
            listenTo: [ stat ],
            editable: editing.never,
        });

        stat.addInvalidationListener((_, isValid) => {
            block.classList[isValid ? "remove" : "add"]("invalid");
        });
    }

    class Fraction {
        constructor(element, dataObject1, property1, name1, dataObject2, property2, name2) {
            this.element = element;
            this.numerElement = document.createElement("span");
            this.denomElement = document.createElement("span");
            element.appendChild(this.numerElement)
            element.appendChild(document.createTextNode(" / "));
            element.appendChild(this.denomElement);

            this.denomDisplay = new DataDisplay({
                element: this.denomElement,
                name: name2,
                validate: n => n > 0,
                dataObject: dataObject2,
                property: property2,
                dataFromString: betterParseInt,
            });

            this.numerDisplay = new DataDisplay({
                element: this.numerElement,
                validate: n => n >= 0 && n <= this.denomDisplay.value,
                name: name1,
                dataObject: dataObject1,
                property: property1,
                dataFromString: betterParseInt,
                listenTo: [ this.denomDisplay ],
                editable: editable.always,
            });
        }
    }

    const hp = new Fraction(document.getElementById("hp"), characterData, "hp", "hp", characterData, "maxHp", "maxHp");

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
        dataToString: data => data.map(d => `${d["class"]} ${d.level}`).join(" / ")
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
        editable: editing.never,
    });

    const skillsByStat = {
        "str": ["Athletics"],
        "dex": ["Acrobatics", "Slight of Hand", "Stealth"],
        "int": ["Arcana", "History", "Investigation", "Nature", "Religion"],
        "wis": ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
        "cha": ["Deception", "Intimidation", "Performance", "Persuasion"],
    }
    const skillFlat = [];
    const skillsToStatMap = new Map();

    for (let stat in skillsByStat) {
        skillFlat.push(...skillsByStat[stat]);
        for (let skill of skillsByStat[stat]) {
            skillsToStatMap.set(skill, stat);
        }
    }

    // skillFlat.sort();

    for (let skill of characterData.skills.proficiencies) {
        if (skillFlat.indexOf(skill) === -1) {
            alert("The character sheet is invalid");
            throw new Error(`Cannot have proficiency in ${skill} because no such skill exists`);
        }
    }

    class Proficiency {
        constructor(group, name, stat, defaultMap = n => n) {
            const block = this.element = <div class={group} id={name}>
                <input id={name + "Checkbox"} type="checkbox" name={group + "Checkbox"}
                    class={group + "Checkbox proficiencyCheckbox"} disabled="true"></input>
                <label for={name + "Checkbox"}>{name} <span class={group + "Bonus proficiencyBonus"}>
                    </span></label>
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

    const skills = [];
    for (let skill of skillFlat) {
        const skillData = new Proficiency("skills", skill, skillsToStatMap.get(skill));
        skills.push(skillData);
        document.getElementById("skills").appendChild(skillData.element);
    }

    const savingThrows = [];
    for (let stat of statNames) {
        const savingThrowData = new Proficiency("savingThrows", statFullNames[stat], stat);
        savingThrows.push(savingThrowData);
        document.getElementById("savingThrows").appendChild(savingThrowData.element);
    }

    const perception = new Proficiency("perception", "Perception", "wis", n => n + 10);
    document.body.replaceChild(perception.element, document.getElementById("perception"));
})()