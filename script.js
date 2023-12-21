var _jsxFileName = "C:\\Users\\liamr\\Documents\\code\\DnD Character Sheet\\script.jsx";
const characterJson = "characters" + new URL(location).pathname + ".json";
(async function () {
  const charResponse = await fetch(characterJson);
  const characterData = await charResponse.json();
  window.characterData = characterData;
  function save() {
    fetch(characterJson, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(characterData)
    });
  }
  function invalidJson() {
    alert("The character sheet is invalid");
  }
  document.getElementById("save").addEventListener("click", save);
  class CalculatedDataDisplay {
    constructor({
      elements,
      dataObject = characterData,
      property,
      getValue = () => dataObject[property],
      dataToString = v => "" + v,
      listenTo = []
    }) {
      this.changeListeners = [];
      this.elements = elements;
      this.getValue = getValue;
      this.dataToString = dataToString;
      for (let e of listenTo) {
        e.addChangeListener(() => this.update());
      }
      this.update();
    }
    get value() {
      return this.getValue();
    }
    update() {
      const value = this.dataToString(this.value);
      for (let element of this.elements) {
        element.innerText = value;
      }
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
  const displayFirst = Symbol();
  class EditableDataDisplay extends CalculatedDataDisplay {
    constructor(args) {
      super(args);
      const {
        validate = () => true,
        setValue = v => (args.dataObject || characterData)[args.property] = v,
        dataFromString = v => v,
        allowNewlines = false,
        getFallback
      } = args;
      this.setValue = v => setValue(v);
      this.setRawVale;
      this.validate = validate;
      this.parse = v => {
        try {
          const val = dataFromString(v);
          return {
            isValid: validate(val),
            value: val
          };
        } catch (e) {
          return {
            isValid: false
          };
        }
      };
      this.allowNewlines = allowNewlines;
      this.getFallback = getFallback;
      for (let element of this.elements) {
        console.log(element);
        const dataValidateOn = element.dataset.validateon;
        console.log(dataValidateOn);
        const validateElement = dataValidateOn ? document.querySelector(dataValidateOn) : element;
        if (validateElement === null) {
          console.log(validateElement);
          throw new Error("Validate Element is null");
        }
        element.addEventListener("input", () => {
          if (element.innerText === "" || this.parse(element.innerText).isValid) {
            validateElement.classList.remove("invalid");
          } else {
            validateElement.classList.add("invalid");
          }
        });
        element.addEventListener("blur", () => {
          validateElement.classList.remove("invalid");
          const parse = this.parse(element.innerText);
          if (parse.isValid) {
            this.setValue(parse.value);
          }
          this.update();
        });
        if (!this.allowNewlines) {
          element.addEventListener("keydown", event => {
            if (event.key === "Enter" && !(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)) {
              element.blur();
            }
          });
        }
      }
      this.update();
    }
    get value() {
      let val = this.getValue();
      if (!this.validate(val)) {
        if (this.getFallback) {
          val = this.getFallback();
          if (!this.validate(val)) {
            if (!(displayFirst in this)) {
              invalidJson();
            }
            throw new Error("Calculated value and fallback value were both invalid");
          } else {
            this.setValue(val);
          }
        } else {
          if (!(displayFirst in this)) {
            invalidJson();
          }
          throw new Error("Calculated value was invalid and no fallback was available");
        }
      }
      this[displayFirst] = undefined;
      return val;
    }
    update() {
      if ("validate" in this) {
        super.update();
      }
    }
  }
  const name = new EditableDataDisplay({
    elements: [document.getElementById("name")],
    property: "name"
  });
  name.addChangeListener(val => document.title = val + " Character Sheet");
  document.title = characterData.name + " Character Sheet";
  const stats = {};
  for (let statName in characterData.stats) {
    const block = /*#__PURE__*/React.createElement("div", {
      class: "stat",
      id: statName,
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 175,
        columnNumber: 23
      }
    }, /*#__PURE__*/React.createElement("div", {
      class: "stat-val",
      "data-validateOn": "#" + statName,
      contenteditable: "plaintext-only",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 176,
        columnNumber: 13
      }
    }), /*#__PURE__*/React.createElement("div", {
      class: "stat-mod inherit-invalid",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 177,
        columnNumber: 13
      }
    }));
    document.getElementById("stats").appendChild(block);
    stats[statName] = {};
    const stat = stats[statName].stat = new EditableDataDisplay({
      elements: [block.getElementsByClassName("stat-val")[0]],
      validate: n => n > 0 && n <= 20,
      dataObject: characterData.stats,
      property: statName,
      dataFromString: parseInt
    });
    const mod = stats[statName].mod = new CalculatedDataDisplay({
      elements: [block.getElementsByClassName("stat-mod")[0]],
      getValue: () => Math.floor((stat.value - 10) / 2),
      dataToString: n => n > 0 ? "+" + n : n,
      listenTo: [stat]
    });
  }
  const maxHp = new EditableDataDisplay({
    elements: [document.getElementById("max-hp")],
    validate: n => n > 0,
    property: "maxHp",
    dataFromString: parseInt
  });
  const currentHp = new EditableDataDisplay({
    elements: [document.getElementById("current-hp")],
    validate: n => n >= 0 && n <= maxHp.value,
    getFallback: () => maxHp.value,
    property: "hp",
    dataFromString: parseInt,
    listenTo: [maxHp]
  });
  const characterLevel = classes => classes.reduce((total, c) => total + c.level, 0);
  const classAndLvl = new EditableDataDisplay({
    elements: [document.getElementById("classAndLvl")],
    property: "classes",
    dataFromString: str => {
      const regex = /(?<=^|\/)\s*([^\n/]+?)\s+(1?[1-9]|[12]0)\s*(?:\/|$)/g;
      let readClass;
      let last;
      let data = [];
      let isFirst = true;
      while (readClass = regex.exec(str)) {
        last = readClass;
        if (isFirst && readClass.index !== 0) {
          throw new Error();
        }
        isFirst = false;
        data.push({
          "class": readClass[1],
          level: +readClass[2]
        });
      }
      if (last.index + last[0].length !== str.length) {
        throw new Error();
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
    enumerable: true
  });
  const proficiencyBonus = new CalculatedDataDisplay({
    elements: [document.getElementById("proficiencyBonus")],
    getValue: () => Math.floor((classAndLvl.characterLevel - 1) / 4) + 2,
    dataToString: n => "+" + n,
    listenTo: [classAndLvl]
  });
  const skills = {
    "str": ["Athletics"],
    "dex": ["Acrobatics", "Slight of Hand", "Stealth"],
    "int": ["Arcana", "History", "Investigation", "Nature", "Religion"],
    "wis": ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
    "cha": ["Deception", "Intimidation", "Performance", "Persuasion"]
  };
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
    const block = /*#__PURE__*/React.createElement("div", {
      class: "skill",
      id: skill,
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 283,
        columnNumber: 23
      }
    }, /*#__PURE__*/React.createElement("input", {
      id: skill + "Checkbox",
      type: "checkbox",
      name: "proficiencyCheckbox",
      class: "proficiencyCheckbox",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 284,
        columnNumber: 13
      }
    }), /*#__PURE__*/React.createElement("label", {
      for: skill + "Checkbox",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 285,
        columnNumber: 13
      }
    }, skill, " ", /*#__PURE__*/React.createElement("span", {
      class: "skillBonus",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 285,
        columnNumber: 53
      }
    })));
    const statMod = stats[skillsToStatMap.get(skill)].mod;
    const skillBonus = new CalculatedDataDisplay({
      elements: [block.getElementsByClassName("skillBonus")[0]],
      getValue: () => statMod.value + (characterData.proficiencies.indexOf(skill) === -1 ? 0 : proficiencyBonus.value),
      dataToString: n => "+" + n,
      listenTo: [statMod, proficiencyBonus]
    });
    const checkbox = block.getElementsByClassName("proficiencyCheckbox")[0];
    checkbox.checked = characterData.proficiencies.indexOf(skill) >= 0;
    checkbox.addEventListener("input", () => {
      if (checkbox.checked) {
        characterData.proficiencies.push(skill);
      } else {
        characterData.proficiencies.splice(characterData.proficiencies.indexOf(skill), 1);
      }
      skillBonus.update();
    });
    document.getElementById("skills").appendChild(block);
  }
})();
