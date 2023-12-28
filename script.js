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
      element,
      dataObject = characterData,
      property,
      getValue = () => dataObject[property],
      dataToString = v => "" + v,
      listenTo = []
    }) {
      this.changeListeners = [];
      this.element = element;
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
      const valueExists = !this.dataObject || this.property in this.dataObject;
      const value = valueExists ? this.value : undefined;
      const str = valueExists ? this.dataToString(this.value) : undefined;
      this.element.innerText = str;
      for (let listener of this.changeListeners) {
        listener(value, str, valueExists);
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
      const {
        dataFromString = v => v
      } = args;
      this.dataObject = args.dataObject || characterData;
      this.property = args.property;
      this.validate = args.validate || (() => true);
      this.parse = v => {
        try {
          console.log(v);
          const val = dataFromString(v);
          return {
            isValid: this.validate(val),
            value: val
          };
        } catch (e) {
          return {
            isValid: false
          };
        }
      };
      this.allowNewlines = args.allowNewlines || false;
      this.getFallback = args.getFallback;
      this.getDefault = args.getDefault;
      console.log(this.element);
      const dataValidateOn = this.element.dataset.validateon;
      console.log(dataValidateOn);
      this.validateElement = dataValidateOn ? document.querySelector(dataValidateOn) : this.element;
      if (this.validateElement === null) {
        throw new Error(`Element ${dataValidateOn} does not exist`);
      }
      this.element.addEventListener("input", () => {
        this.checkElementValidity();
      });
      this.element.addEventListener("focus", () => {
        this.validateElement.classList.add("editor-focused");
      });
      this.element.addEventListener("blur", () => {
        this.validateElement.classList.remove("editor-focused");
        if (this.element.innerText === "") {
          delete this.dataObject[this.property];
        } else {
          const parse = this.parse(this.element.innerText);
          if (parse.isValid) {
            this.dataObject[this.property] = parse.value;
          }
        }
        this.update();
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
      } else {
        this.validateElement.classList.add("invalid");
      }
    }
    get value() {
      return this.dataObject[this.property] = this.getValue();
    }
    update() {
      if ("validate" in this) {
        super.update();
        if (this.getDefault) {
          this.element.dataset.default = this.getDefault();
        }
        this.checkElementValidity();
      }
    }
  }
  const name = new EditableDataDisplay({
    element: document.getElementById("name"),
    property: "name"
  });
  name.addChangeListener((_, str) => document.title = str + " Character Sheet");
  document.title = characterData.name + " Character Sheet";
  const stats = {};
  for (let statName in characterData.stats) {
    const block = /*#__PURE__*/React.createElement("div", {
      class: "stat",
      id: statName,
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 162,
        columnNumber: 23
      }
    }, /*#__PURE__*/React.createElement("div", {
      class: "stat-val",
      "data-validateOn": "#" + statName,
      contenteditable: "plaintext-only",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 163,
        columnNumber: 13
      }
    }), /*#__PURE__*/React.createElement("div", {
      class: "stat-mod inherit-invalid",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 164,
        columnNumber: 13
      }
    }));
    document.getElementById("stats").appendChild(block);
    stats[statName] = {};
    const stat = stats[statName].stat = new EditableDataDisplay({
      element: block.getElementsByClassName("stat-val")[0],
      validate: n => n > 0 && n <= 20,
      dataObject: characterData.stats,
      property: statName,
      dataFromString: parseInt
    });
    const mod = stats[statName].mod = new CalculatedDataDisplay({
      element: block.getElementsByClassName("stat-mod")[0],
      getValue: () => Math.floor((stat.value - 10) / 2),
      dataToString: n => n > 0 ? "+" + n : n,
      listenTo: [stat]
    });
  }
  const maxHp = new EditableDataDisplay({
    element: document.getElementById("max-hp"),
    validate: n => n > 0,
    property: "maxHp",
    dataFromString: parseInt
  });
  const currentHp = new EditableDataDisplay({
    element: document.getElementById("current-hp"),
    validate: n => n >= 0 && n <= maxHp.value,
    getFallback: () => maxHp.value,
    property: "hp",
    dataFromString: parseInt,
    listenTo: [maxHp]
  });
  const characterLevel = classes => classes.reduce((total, c) => total + c.level, 0);
  const classAndLvl = new EditableDataDisplay({
    element: document.getElementById("classAndLvl"),
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
    element: document.getElementById("proficiencyBonus"),
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
        lineNumber: 270,
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
        lineNumber: 271,
        columnNumber: 13
      }
    }), /*#__PURE__*/React.createElement("label", {
      for: skill + "Checkbox",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 272,
        columnNumber: 13
      }
    }, skill, " ", /*#__PURE__*/React.createElement("span", {
      class: "skillBonus",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 272,
        columnNumber: 53
      }
    })));
    const statMod = stats[skillsToStatMap.get(skill)].mod;
    const skillBonus = new CalculatedDataDisplay({
      element: block.getElementsByClassName("skillBonus")[0],
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
