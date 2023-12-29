const characterJson = "characters" + new URL(location).pathname + ".json";

(async function() {
    const charResponse = await fetch(characterJson);
    const characterData = await charResponse.json();
    window.characterData = characterData;
    let editing = false;

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
        console.log("foo");
        editing = true;

        console.log(editingMode);
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

    function invalidJson() {
        alert("The character sheet is invalid");
    }

    function betterParseInt(str) {
        if (/^(?:\+|-)?\d+$/.test(str)) {
            return parseInt(str);
        }
        else 
            throw Error("Invalid int " + str);
    }

    document.getElementById("save").addEventListener("click", stopEditing);
    document.getElementById("edit").addEventListener("click", startEditing);

    class CalculatedDataDisplay {
        constructor({element, dataObject = characterData, property, getValue = () => dataObject[property], dataToString = v => "" + v, listenTo = []}) {
            this.changeListeners = [];
            this.element = element;
            this.getValue = getValue;
            this.dataToString = dataToString

            for (let e of listenTo) {
                e.addChangeListener(() => {
                    if (editing && this.getDefault && this.valueExists) {
                        this.element.classList.add("changed");
                    }
                    this.update()
                });
            }

            element.contentEditable = "false";

            this.update();
        }

        get value() {
            return this.getValue();
        }

        get valueExists() {
            return true;
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

            const { dataFromString = v => v } = args;
            this.dataObject = args.dataObject || characterData;
            this.property = args.property;
            this.validate = args.validate || (() => true);
            this.parse = v => {
                try {
                    const val = dataFromString(v);
                    return {
                        isValid: this.validate(val),
                        value: val,
                    };
                }
                catch (e) {
                    return { isValid: false };
                }
            };
            this.allowNewlines = args.allowNewlines || false;
            this.getFallback = args.getFallback;
            this.getDefault = args.getDefault;
            this.editable = args.editable || editable.inEditingMode;

            switch (this.editable) {
                case editable.always:
                    this.element.contentEditable = contentEditableValue;
                    break;
                case editable.inEditingMode:
                    editingMode.push(this.element);
                    break;
            }

            const dataValidateOn = this.element.dataset.validateon;
            this.validateElement = dataValidateOn ? document.querySelector(dataValidateOn) : this.element;
            if (this.validateElement === null) {
                throw new Error(`Element ${dataValidateOn} does not exist`);
            }

            this.element.addEventListener("input", () => {
                if (this.element.innerText !== this.element.innerHTML) {
                    this.element.innerText = this.element.innerText
                }
                this.checkElementValidity();
            });

            this.element.addEventListener("focus", () => {
                this.validateElement.classList.add("editor-focused");
                this.element.classList.remove("changed");
            });

            this.element.addEventListener("click", event => {
                event.preventDefault();
            });

            this.element.addEventListener("blur", () => {
                this.validateElement.classList.remove("editor-focused");
                let doListeners;
                if (this.element.innerText === "") {
                    delete this.dataObject[this.property];
                    doListeners = true;
                }
                else {
                    const parse = this.parse(this.element.innerText);
                    if (parse.isValid && this.dataObject[this.property] !== parse.value && (this.allowNewlines || !/\n|\r|\u2028|\u2029/.test(this.element.innerText))) {
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
            if (this.element.innerText === "" || this.parse(this.element.innerText).isValid) {
                this.validateElement.classList.remove("invalid");
                return true;
            }
            else {
                this.validateElement.classList.add("invalid");
                return false;
            }
        }

        get valueExists() {
            return !this.dataObject || this.property in this.dataObject;
        }

        update(doListeners) {
            if ("validate" in this) {
                super.update(doListeners);
                if (this.getDefault) {
                    this.element.dataset.default = this.dataToString(this.getDefault());
                }
                const index = invalid.indexOf(this);
                if (this.checkElementValidity()) {
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
        }
    }

    const name = new EditableDataDisplay({
        element: document.getElementById("name"),
        property: "name",
    });
    name.addChangeListener((_, str) => document.title = str + " Character Sheet");
    
    document.title = characterData.name + " Character Sheet";

    const stats = {};

    for (let statName in characterData.stats) {
        const block = <div class="stat" id={statName}>
            <div class="stat-val" data-validateOn={"#" + statName}></div>
            <div class="stat-mod inherit-invalid"></div>
        </div>
        document.getElementById("stats").appendChild(block);

        stats[statName] = {};
        const stat = stats[statName].stat = new EditableDataDisplay({
            element: block.getElementsByClassName("stat-val")[0],
            validate: n => n > 0 && n <= 20,
            dataObject: characterData.stats, 
            property: statName, 
            dataFromString: betterParseInt,
        });
        const mod = stats[statName].mod = new CalculatedDataDisplay({
            element: block.getElementsByClassName("stat-mod")[0],
            getValue: () => Math.floor((stat.value - 10) / 2),
            dataToString: n => n > 0 ? "+" + n : n,
            listenTo: [ stat ],
        });
    }

    const maxHp = new EditableDataDisplay({
        element: document.getElementById("max-hp"),
        validate: n => n > 0,
        property: "maxHp",
        dataFromString: betterParseInt,
    });

    const currentHp = new EditableDataDisplay({
        element: document.getElementById("current-hp"),
        validate: n => n >= 0 && n <= maxHp.value,
        getFallback: () => maxHp.value,
        property: "hp",
        dataFromString: betterParseInt,
        listenTo: [ maxHp ],
        editable: editable.always,
    });

    const characterLevel = classes => classes.reduce((total, c) => total + c.level, 0);

    const classAndLvl = new EditableDataDisplay({
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

    const proficiencyBonus = new CalculatedDataDisplay({
        element: document.getElementById("proficiencyBonus"),
        getValue: () => Math.floor((classAndLvl.characterLevel - 1) / 4) + 2,
        dataToString: n => "+" + n,
        listenTo: [ classAndLvl ],
    });

    const skills = {
        "str": ["Athletics"],
        "dex": ["Acrobatics", "Slight of Hand", "Stealth"],
        "int": ["Arcana", "History", "Investigation", "Nature", "Religion"],
        "wis": ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
        "cha": ["Deception", "Intimidation", "Performance", "Persuasion"],
    }
    const skillFlat = [];
    const skillsToStatMap = new Map();

    for (let stat in skills) {
        skillFlat.push(...skills[stat]);
        for (let skill of skills[stat]) {
            skillsToStatMap.set(skill, stat);
        }
    }

    // skillFlat.sort();

    for (let skill of characterData.proficiencies) {
        if (skillFlat.indexOf(skill) === -1) {
            invalidJson();
            throw new Error(`Cannot have proficiency in ${skill} because no such skill exists`);
        }
    }

    for (let skill of skillFlat) {
        const block = <div class="skill" id={skill}>
            <input id={skill + "Checkbox"} type="checkbox" name="proficiencyCheckbox" class="proficiencyCheckbox showDisabled" disabled="true"></input>
            <label for={skill + "Checkbox"}>{skill} <span class="skillBonus"></span></label>
        </div>;
        const statMod = stats[skillsToStatMap.get(skill)].mod;
        const skillBonus = new EditableDataDisplay({
            element: block.getElementsByClassName("skillBonus")[0],
            getDefault: () => (statMod.value 
                + (characterData.proficiencies.indexOf(skill) === -1 ? 0 : proficiencyBonus.value)),
            dataObject: characterData.skillBonuses,
            property: skill,
            dataToString: n => n > 0 ? "+" + n : n,
            validate: n => !isNaN(n),
            dataFromString: betterParseInt,
            listenTo: [ statMod, proficiencyBonus ],
        });

        const checkbox = block.getElementsByClassName("proficiencyCheckbox")[0];

        editingModeInputs.push(checkbox);

        checkbox.checked = characterData.proficiencies.indexOf(skill) >= 0;

        checkbox.addEventListener("input", () => {
            if (checkbox.checked) {
                characterData.proficiencies.push(skill);
            }
            else {
                characterData.proficiencies.splice(characterData.proficiencies.indexOf(skill), 1);
            }

            skillBonus.update();
        });

        document.getElementById("skills").appendChild(block);
    }
})()