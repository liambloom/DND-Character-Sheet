var _jsxFileName = "C:\\Users\\liamr\\Documents\\code\\DnD Character Sheet\\script.jsx";
// #region React

// https://stackoverflow.com/a/42405694/11326662
const React = {
  createElement: function (tag, attrs, children) {
    var element = document.createElement(tag);
    for (let name in attrs) {
      if (name && attrs.hasOwnProperty(name)) {
        let value = attrs[name];
        if (value === true) {
          element.setAttribute(name, name);
        } else if (value !== false && value != null) {
          element.setAttribute(name, value.toString());
        }
      }
    }
    for (let i = 2; i < arguments.length; i++) {
      let child = arguments[i];
      element.appendChild(child.nodeType == null ? document.createTextNode(child.toString()) : child);
    }
    return element;
  }
};
// #endregion

// #region Constants
const characterJson = "characters" + new URL(location).pathname + ".json";
const newlineRegex = /[\n\r\u2028\u2029]/g;
const statNames = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
const statToSkillMap = {
  "Strength": ["Athletics"],
  "Dexterity": ["Acrobatics", "Slight of Hand", "Stealth"],
  "Intelligence": ["Arcana", "History", "Investigation", "Nature", "Religion"],
  "Wisdom": ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
  "Charisma": ["Deception", "Intimidation", "Performance", "Persuasion"]
};
const skillToStatMap = {};
for (let stat in statToSkillMap) {
  // skillNames.push(...statToSkillMap[stat]);
  for (let skill of statToSkillMap[stat]) {
    skillToStatMap[skill] = stat;
  }
}
const hitDiceTable = {
  "sorcerer": 6,
  "wizard": 6,
  "artificer": 8,
  "bard": 8,
  "cleric": 8,
  "druid": 8,
  "monk": 8,
  "rouge": 8,
  "warlock": 8,
  "fighter": 10,
  "paladin": 10,
  "ranger": 10,
  "barbarian": 12
};
const editable = {
  always: Symbol("Always Editable"),
  inEditingMode: Symbol("In Editing Mode"),
  never: Symbol("Never Editable")
};
const testElement = document.createElement("div");
testElement.setAttribute("contentEditable", "PLAINTEXT-ONLY");
const supportsPlaintextOnly = testElement.contentEditable === "plaintext-only";
const contentEditableValue = supportsPlaintextOnly ? "plaintext-only" : "true";
function betterParseInt(str) {
  if (/^[+\-]?\d+$/.test(str)) {
    return parseInt(str);
  } else throw Error("Invalid int " + str);
}
const signedIntToStr = n => n > 0 ? "+" + n : n;
// #endregion

// #region Editing Mode
let editing = false;
let saving = false;
const editingMode = [];
const editingModeInputs = [];
const invalid = [];
const savingIndicator = document.getElementById("saving");
async function save() {
  saving = true;
  savingIndicator.style.display = "initial";
  const res = await fetch(characterJson, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(characterData)
  });
  savingIndicator.style.display = "none";
  if (!res.ok) {
    if (confirm(`Error attempting to save changes: "${res.status} - ${res.statusText}." Reload page (recommended)?`)) {
      location.reload();
    }
  }
  saving = false;
}
function startEditing() {
  editing = true;
  document.body.dataset.editing = "true";
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
  document.body.dataset.editing = "false";
  save();
  for (let element of editingMode) {
    element.contentEditable = "false";
  }
  for (let element of editingModeInputs) {
    element.disabled = true;
  }
  let changed = document.getElementsByClassName("changed");
  while (changed.length) {
    changed[0].classList.remove("changed");
  }
}
function characterChanged() {
  if (!editing) {
    save();
    console.log("Saving...");
  }
}
document.getElementById("edit").addEventListener("click", () => {
  if (editing) {
    stopEditing();
  } else {
    startEditing();
  }
});
window.addEventListener("beforeunload", event => {
  if (editing || saving) {
    event.preventDefault();
  }
});
// #endregion

// #region Reactivity & Other Classes
class DataDisplay {
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
    this.editable = args.editable ?? editable.inEditingMode;
    const {
      listenTo = []
    } = args;
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
        this.update();
      });
    }
    this.element.addEventListener("paste", event => {
      event.preventDefault();
      const selection = getSelection();
      let first = true;
      for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        console.log(range.startContainer);
        if (range.startContainer === this.element.childNodes[0] || range.startContainer === this.element) {
          range.deleteContents();
          console.log(event.clipboardData);
          let content = event.clipboardData.getData("text/plain");
          console.log(content);
          if (!this.allowNewlines) {
            content = content.replace(newlineRegex, "");
          }
          console.log(content);
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
    this.element.addEventListener("input", () => {
      if (!this.allowNewlines && newlineRegex.test(this.element.innerText)) {
        const brs = this.element.getElementsByTagName("br");
        while (brs.length) {
          brs[0].remove();
        }
        this.element.innerText = this.element.innerText.replace(newlineRegex, "");
        this.element.normalize();
        const selection = getSelection();
        const node = this.element.childNodes[0] ?? this.element;
        for (let i = 0; i < selection.rangeCount; i++) {
          const range = selection.getRangeAt(i);
          if (range.startContainer === this.element || range.startContainer === node) {
            selection.removeRange(range);
          }
        }
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index);
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
      if (this.getDefault?.() != null && this.element.innerText === "") {
        delete this.dataObject[this.property];
        doListeners = true;
      } else {
        const parse = this.parse(this.element.innerText);
        if (parse.isValid && this.dataObject[this.property] !== parse.value && (this.allowNewlines || !newlineRegex.test(this.element.innerText))) {
          this.dataObject[this.property] = parse.value;
          characterChanged();
          doListeners = true;
        } else {
          doListeners = false;
        }
      }
      this.element.parentElement.scroll(0, 0);
      this.update(doListeners);
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
    const display = actual || this.element.innerText === "" && (this.element === document.activeElement || "default" in this.element.dataset);
    if (display) {
      this.element.classList.remove("invalid");
    } else {
      this.element.classList.add("invalid");
    }
    for (let callback of this.invalidationListeners) {
      callback(actual, display, parsed.value);
    }
    return {
      actual,
      display
    };
  }
  parse(v) {
    try {
      const val = this.dataFromString(v);
      return {
        isValid: this.validate(val) && (typeof val !== "number" || val < Number.MAX_SAFE_INTEGER),
        value: val
      };
    } catch (e) {
      return {
        isValid: false
      };
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
    this.element.innerText = str;
    if (doListeners) {
      for (let listener of this.changeListeners) {
        listener(value, str, valueExists);
      }
    }
    if (this.getDefault) {
      const defaultVal = this.getDefault();
      if (defaultVal === null) {
        delete this.element.dataset.default;
      } else {
        this.element.dataset.default = this.dataToString(defaultVal);
      }
    }
    const index = invalid.indexOf(this);
    if (this.checkElementValidity().display) {
      if (index >= 0) {
        invalid.splice(index, 1);
      }
    } else {
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
class Fraction {
  constructor(element, numerArgs, denomArgs) {
    this.element = element;
    if (this.element.childNodes.length) {
      this.numerElement = this.element.querySelector("[data-numer]");
      this.denomElement = this.element.querySelector("[data-denom]");
    } else {
      this.numerElement = document.createElement("span");
      this.denomElement = document.createElement("span");
      element.appendChild(this.numerElement);
      element.appendChild(document.createTextNode(" / "));
      element.appendChild(this.denomElement);
    }
    this.denomDisplay = new DataDisplay({
      element: this.denomElement,
      validate: n => n > 0,
      // dataObject: dataObject2,
      // property: property2,
      dataFromString: betterParseInt,
      ...denomArgs
    });
    this.numerDisplay = new DataDisplay({
      element: this.numerElement,
      validate: n => n >= 0 && n <= this.denomDisplay.value,
      // dataObject: dataObject1,
      // property: property1,
      dataFromString: betterParseInt,
      listenTo: [this.denomDisplay],
      editable: editable.always,
      ...numerArgs
    });
  }
}
class Proficiency {
  constructor(block, group, name, stat, defaultMap = n => n) {
    block = this.element ||= /*#__PURE__*/React.createElement("div", {
      class: group + " proficiency",
      id: name,
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 439,
        columnNumber: 34
      }
    }, /*#__PURE__*/React.createElement("input", {
      id: name + "Checkbox",
      type: "checkbox",
      name: group + "Checkbox",
      class: group + "Checkbox proficiencyCheckbox",
      disabled: "true",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 440,
        columnNumber: 13
      }
    }), /*#__PURE__*/React.createElement("label", {
      for: name + "Checkbox",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 442,
        columnNumber: 13
      }
    }, /*#__PURE__*/React.createElement("span", {
      class: group + "Bonus proficiencyBonus",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 442,
        columnNumber: 44
      }
    }), " ", name, " ", /*#__PURE__*/React.createElement("span", {
      class: "proficiencyBonusStat",
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 442,
        columnNumber: 106
      }
    }, "(", stat.substring(0, 3), ")")));
    const statMod = stats[stat].mod;
    const bonus = this.bonus = new DataDisplay({
      element: block.getElementsByClassName("proficiencyBonus")[0],
      getDefault: () => defaultMap(statMod.value + (characterData[group].proficiencies.indexOf(name) === -1 ? 0 : proficiencyBonus.value)),
      dataObject: characterData[group].bonuses,
      property: name,
      dataToString: signedIntToStr,
      dataFromString: betterParseInt,
      validate: n => !isNaN(n),
      listenTo: [statMod, proficiencyBonus]
    });
    const checkbox = this.checkbox = block.getElementsByClassName("proficiencyCheckbox")[0];
    editingModeInputs.push(checkbox);
    checkbox.checked = characterData[group].proficiencies.indexOf(name) >= 0;
    checkbox.addEventListener("input", () => {
      if (checkbox.checked) {
        characterData[group].proficiencies.push(name);
      } else {
        characterData[group].proficiencies.splice(characterData[group].proficiencies.indexOf(name), 1);
      }
      bonus.update();
    });
  }
}
// #endregion

// #region Fetch character data
const charResponse = await fetch(characterJson);
const characterData = await charResponse.json();
window.characterData = characterData;
for (let skill of characterData.skills.proficiencies) {
  if (!(skill in skillToStatMap)) {
    alert("The character sheet is invalid");
    throw new Error(`Cannot have proficiency in ${skill} because no such skill exists`);
  }
}
// #endregion

// #region Character Data
const name = new DataDisplay({
  element: document.getElementById("name"),
  property: "name"
});
name.addChangeListener((_, str) => document.title = str + " Character Sheet");
document.title = characterData.name + " Character Sheet";
const stats = {};
for (let statName of statNames) {
  const block = /*#__PURE__*/React.createElement("div", {
    class: "stat",
    id: statName,
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 504,
      columnNumber: 19
    }
  }, /*#__PURE__*/React.createElement("div", {
    class: "sectionTitle staticPos",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 505,
      columnNumber: 9
    }
  }, statName), /*#__PURE__*/React.createElement("div", {
    class: "stat-val ignore-invalid",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 506,
      columnNumber: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 506,
      columnNumber: 46
    }
  })), /*#__PURE__*/React.createElement("div", {
    class: "stat-mod inherit-invalid",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 507,
      columnNumber: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 507,
      columnNumber: 47
    }
  })));
  document.getElementById("stats").appendChild(block);
  stats[statName] = {};
  const stat = stats[statName].stat = new DataDisplay({
    element: block.getElementsByClassName("stat-val")[0].children[0],
    validate: n => n > 0 && n <= 20,
    dataObject: characterData.stats,
    property: statName,
    dataFromString: betterParseInt
  });
  const args = {
    element: block.getElementsByClassName("stat-mod")[0].children[0],
    getDefault: () => Math.floor((stat.value - 10) / 2),
    dataToString: signedIntToStr,
    listenTo: [stat],
    editable: editable.never
  };
  const mod = stats[statName].mod = new DataDisplay(args);
  stat.addInvalidationListener((_, isValid) => {
    block.classList[isValid ? "remove" : "add"]("invalid");
  });
}
const characterLevel = classes => classes.reduce((total, c) => total + c.level, 0);
const classAndLvl = new DataDisplay({
  element: document.getElementById("classAndLvl"),
  property: "classes",
  dataFromString: str => {
    const regex = /^\s*([^\n/]+?)\s+(1?[1-9]|[12]0)\s*$/;
    let data = [];
    for (let readClass of str.split("/")) {
      let parsed = readClass.match(regex);
      data.push({
        "class": parsed[1],
        level: +parsed[2]
      });
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
const proficiencyBonus = new DataDisplay({
  element: document.getElementById("proficiencyBonus"),
  getDefault: () => Math.floor((classAndLvl.characterLevel - 1) / 4) + 2,
  dataToString: n => "+" + n,
  listenTo: [classAndLvl],
  editable: editable.never
});
const skills = {};
for (let skill of Object.keys(skillToStatMap).sort()) {
  const skillData = new Proficiency(undefined, "skills", skill, skillToStatMap[skill]);
  skills[skill] = skillData;
  document.getElementById("skills").appendChild(skillData.element);
}
const savingThrows = [];
for (let stat of statNames) {
  const savingThrowData = new Proficiency(undefined, "savingThrows", stat, stat);
  savingThrows.push(savingThrowData);
  document.getElementById("savingThrows").appendChild(savingThrowData.element);
}
const perceptionStandalone = new DataDisplay({
  element: document.getElementById("perceptionValue"),
  getDefault: () => 10 + skills.Perception.bonus.value,
  listenTo: [skills.Perception.bonus],
  editable: editable.never
});
const inspiration = document.getElementById("inspiration");
if (characterData.inspiration) {
  inspiration.checked = true;
}
inspiration.addEventListener("change", () => {
  characterData.inspiration = inspiration.checked;
  characterChanged();
});
const ac = new DataDisplay({
  element: document.getElementById("ac"),
  property: "ac",
  dataFromString: betterParseInt,
  validate: n => n > 0,
  listenTo: [stats.Dexterity.mod]
});
const initiative = new DataDisplay({
  element: document.getElementById("initiative"),
  getDefault: () => stats.Dexterity.mod.value,
  dataToString: signedIntToStr,
  editable: editable.never,
  listenTo: [stats.Dexterity.mod]
});
const speed = new DataDisplay({
  element: document.getElementById("speed"),
  property: "speed",
  dataFromString: betterParseInt,
  validate: n => n > 0
});
const tempHp = new DataDisplay({
  element: document.getElementById("temp-hp-value"),
  property: "tempHp",
  dataFromString: betterParseInt,
  validate: n => n >= 0
});
const hitDiceArgs = {
  dataFromString: str => {
    const dice = str.split("+");
    const val = [];
    for (let die of dice) {
      let [n, d, err] = die.split("d");
      if (err || !n || !d) {
        throw new Error();
      }
      val.push({
        d: betterParseInt(d),
        n: betterParseInt(n)
      });
    }
    return val;
  },
  dataToString: dat => {
    let str = "";
    for (let die of dat) {
      if (str.length) {
        str += "+";
      }
      str += `${die.n}d${die.d}`;
    }
    return str;
  },
  getDefault: () => {
    const v = [];
    for (let c of classAndLvl.value) {
      const d = hitDiceTable[c.class.toLowerCase()];
      if (!d) {
        return null;
      }
      v.push({
        n: c.level,
        d
      });
    }
    return v;
  }
};
const totalHitDice = new DataDisplay({
  ...hitDiceArgs,
  element: document.getElementById("hit-dice-total"),
  property: "hitDiceTotal",
  validate: val => val.map(({
    n
  }) => n).reduce((sum, v) => sum + v) === classAndLvl.characterLevel,
  listenTo: [classAndLvl]
});
const hitDice = new DataDisplay({
  ...hitDiceArgs,
  element: document.getElementById("hit-dice-value"),
  property: "hitDice",
  validate: val => val.map(({
    n
  }) => n).reduce((sum, v) => sum + v) <= classAndLvl.characterLevel,
  listenTo: [classAndLvl, totalHitDice]
});
const dieAvg = (d, n) => (Math.ceil((d - 1) / 2) + 1) * n;
const hp = new Fraction(document.getElementById("health"), {
  property: "hp"
}, {
  property: "maxHp",
  getDefault: () => totalHitDice.value === null ? null : totalHitDice.value[0].d + stats.Constitution.mod.value * classAndLvl.characterLevel + dieAvg(totalHitDice.value[0].d, totalHitDice.value[0].n - 1) + totalHitDice.value.slice(1).map(({
    d,
    n
  }) => dieAvg(d, n)).reduce((sum, v) => sum + v, 0),
  listenTo: [stats.Constitution.mod, classAndLvl, totalHitDice]
});
// #endregion
