function ListAddButton() {
  return /*#__PURE__*/React.createElement("button", {
    class: "list-add",
    type: "button"
  }, /*#__PURE__*/React.createElement("div", {
    class: "list-add-line"
  }), /*#__PURE__*/React.createElement("div", {
    class: "list-plus"
  }, /*#__PURE__*/React.createElement("div", {
    class: "list-plus-h"
  }), /*#__PURE__*/React.createElement("div", {
    class: "list-plus-v"
  })), /*#__PURE__*/React.createElement("div", {
    class: "list-add-line"
  }));
}
function DsCheckbox({
  type
}) {
  return /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    name: "ds-" + type
  }), /*#__PURE__*/React.createElement("div", {
    class: "customCheckbox"
  }));
}
function DsCounter({
  type
}) {
  return /*#__PURE__*/React.createElement("div", {
    id: `ds-${type}-counter`,
    class: "ds-counter"
  }, /*#__PURE__*/React.createElement("div", {
    class: "ds-line"
  }), /*#__PURE__*/React.createElement("div", {
    class: "ds-boxes"
  }, /*#__PURE__*/React.createElement(DsCheckbox, {
    type: type
  }), /*#__PURE__*/React.createElement(DsCheckbox, {
    type: type
  }), /*#__PURE__*/React.createElement(DsCheckbox, {
    type: type
  })));
}
export const mainContent = /*#__PURE__*/React.createElement("div", {
  id: "mainpage",
  class: "page"
}, /*#__PURE__*/React.createElement("header", {
  class: "page-header"
}, /*#__PURE__*/React.createElement("div", {
  class: "left-header-banner"
}, /*#__PURE__*/React.createElement("div", {
  class: "header-banner-back"
})), /*#__PURE__*/React.createElement("div", {
  class: "header-labeled-container"
}, /*#__PURE__*/React.createElement("div", {
  class: "header-large-value-box"
}, /*#__PURE__*/React.createElement("div", {
  class: "header-large-value-container"
}, /*#__PURE__*/React.createElement("div", {
  id: "name-value",
  class: "header-large-value"
}))), /*#__PURE__*/React.createElement("div", {
  class: "header-label header-large-label"
}, "Character Name")), /*#__PURE__*/React.createElement("div", {
  class: "header-other"
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  id: "main-header-other-contents",
  class: "header-other-contents"
}, /*#__PURE__*/React.createElement("div", {
  id: "hr1"
}), /*#__PURE__*/React.createElement("div", {
  id: "hr2"
}), /*#__PURE__*/React.createElement("div", {
  id: "classAndLvl"
}), /*#__PURE__*/React.createElement("div", {
  id: "background"
}), /*#__PURE__*/React.createElement("div", {
  id: "playerName"
}), /*#__PURE__*/React.createElement("div", {
  class: "header-label"
}, "Class & Level"), /*#__PURE__*/React.createElement("div", {
  class: "header-label"
}, "Background"), /*#__PURE__*/React.createElement("div", {
  class: "header-label"
}, "Player Name"), /*#__PURE__*/React.createElement("div", {
  id: "race"
}), /*#__PURE__*/React.createElement("div", {
  id: "alignment"
}), /*#__PURE__*/React.createElement("div", {
  id: "xp"
}), /*#__PURE__*/React.createElement("div", {
  class: "header-label"
}, "Race"), /*#__PURE__*/React.createElement("div", {
  class: "header-label"
}, "Alignment"), /*#__PURE__*/React.createElement("div", {
  class: "header-label"
}, "Experience Points")))), /*#__PURE__*/React.createElement("div", {
  class: "right-header-banner"
})), /*#__PURE__*/React.createElement("div", {
  id: "numbers"
}, /*#__PURE__*/React.createElement("div", {
  id: "stats"
}), /*#__PURE__*/React.createElement("div", {
  id: "right-number-flex"
}, /*#__PURE__*/React.createElement("label", {
  for: "inspiration",
  id: "inspiration-label",
  class: "standaloneLabeledValue"
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
  type: "checkbox",
  id: "inspiration"
}), /*#__PURE__*/React.createElement("div", null, "&check;")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, "Inspiration"))), /*#__PURE__*/React.createElement("div", {
  class: "standaloneLabeledValue"
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  id: "proficiencyBonus"
})), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, "Proficiency Bonus"))), /*#__PURE__*/React.createElement("div", {
  id: "savingThrowsContainer"
}, /*#__PURE__*/React.createElement("div", {
  id: "savingThrows"
}), /*#__PURE__*/React.createElement("span", {
  class: "sectionTitle staticPos"
}, "Saving Throws")), /*#__PURE__*/React.createElement("div", {
  id: "skillContainer"
}, /*#__PURE__*/React.createElement("div", {
  id: "skills"
}), /*#__PURE__*/React.createElement("span", {
  class: "sectionTitle staticPos"
}, "Skills")))), /*#__PURE__*/React.createElement("div", {
  id: "lower-proficiencies"
}, /*#__PURE__*/React.createElement("div", {
  id: "perception",
  class: "standaloneLabeledValue"
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  id: "perceptionValue"
})), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, "Passive Perception"))), /*#__PURE__*/React.createElement("div", {
  id: "other-proficiencies"
}, /*#__PURE__*/React.createElement("div", {
  id: "other-proficiencies-content"
}, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
  class: "prof-type"
}, "Armor:"), " ", /*#__PURE__*/React.createElement("span", {
  id: "armor-prof"
})), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
  class: "prof-type"
}, "Weapons:"), " ", /*#__PURE__*/React.createElement("span", {
  id: "weapons-prof"
})), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
  class: "prof-type"
}, "Tools:"), " ", /*#__PURE__*/React.createElement("span", {
  id: "tools-prof"
})), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
  class: "prof-type"
}, "Languages:"), " ", /*#__PURE__*/React.createElement("span", {
  id: "languages-prof"
}))), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Other Proficiencies & Languages"))), /*#__PURE__*/React.createElement("div", {
  id: "misc"
}, /*#__PURE__*/React.createElement("div", {
  id: "misc-row-1"
}, /*#__PURE__*/React.createElement("div", {
  id: "ac-container"
}, /*#__PURE__*/React.createElement("div", {
  class: "inputLine"
}, /*#__PURE__*/React.createElement("div", {
  id: "ac",
  class: "ignore-invalid"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Armor Class")), /*#__PURE__*/React.createElement("div", {
  id: "initiative-container"
}, /*#__PURE__*/React.createElement("div", {
  class: "written"
}, /*#__PURE__*/React.createElement("div", {
  id: "initiative",
  class: "ignore-invalid"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Initiative")), /*#__PURE__*/React.createElement("div", {
  id: "speed-container"
}, /*#__PURE__*/React.createElement("div", {
  class: "inputLine"
}, /*#__PURE__*/React.createElement("div", {
  id: "speed",
  class: "ignore-invalid"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Speed"))), /*#__PURE__*/React.createElement("div", {
  id: "misc-row-2"
}, /*#__PURE__*/React.createElement("div", {
  id: "health"
}, /*#__PURE__*/React.createElement("div", {
  class: "topText inputLine"
}, /*#__PURE__*/React.createElement("span", null, "Hit Point Maximum:\xA0"), /*#__PURE__*/React.createElement("span", {
  id: "maxHpValue",
  class: "ignore-invalid",
  "data-denom": true
})), /*#__PURE__*/React.createElement("div", {
  class: "inputLine"
}, /*#__PURE__*/React.createElement("div", {
  id: "currentHp",
  class: "ignore-invalid",
  "data-numer": true
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Current Hit Points")), /*#__PURE__*/React.createElement("div", {
  id: "temp-hp"
}, /*#__PURE__*/React.createElement("div", {
  class: "inputLine"
}, /*#__PURE__*/React.createElement("div", {
  id: "temp-hp-value",
  class: "ignore-invalid"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Temporary Hit Points"))), /*#__PURE__*/React.createElement("div", {
  id: "misc-row-3"
}, /*#__PURE__*/React.createElement("div", {
  id: "hit-dice"
}, /*#__PURE__*/React.createElement("div", {
  class: "topText inputLine"
}, /*#__PURE__*/React.createElement("span", null, "Total:\xA0"), /*#__PURE__*/React.createElement("span", {
  id: "hit-dice-total",
  class: "ignore-invalid",
  "data-denom": true
})), /*#__PURE__*/React.createElement("div", {
  class: "inputLine"
}, /*#__PURE__*/React.createElement("div", {
  id: "hit-dice-value",
  class: "ignore-invalid"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Hit Dice")), /*#__PURE__*/React.createElement("div", {
  id: "death-saves"
}, /*#__PURE__*/React.createElement("div", {
  id: "death-saves-grid"
}, /*#__PURE__*/React.createElement("div", {
  id: "ds-success-label",
  class: "ds-label"
}, "Successes"), /*#__PURE__*/React.createElement(DsCounter, {
  type: "success"
}), /*#__PURE__*/React.createElement("div", {
  id: "ds-fail-label",
  class: "ds-label"
}, "Failures"), /*#__PURE__*/React.createElement(DsCounter, {
  type: "fail"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Death Saves")))), /*#__PURE__*/React.createElement("div", {
  id: "attacks"
}, /*#__PURE__*/React.createElement("div", {
  id: "attacks-header",
  class: "list-header"
}, /*#__PURE__*/React.createElement("div", {
  class: "weapon-name"
}, "Name"), /*#__PURE__*/React.createElement("div", {
  class: "weapon-bonus"
}, "Atk Bonus"), /*#__PURE__*/React.createElement("div", {
  class: "weapon-damage"
}, "Damage/Type")), /*#__PURE__*/React.createElement("div", {
  id: "attacks-table",
  class: "list"
}, /*#__PURE__*/React.createElement(ListAddButton, null)), /*#__PURE__*/React.createElement("div", {
  id: "attacks-text-container"
}, /*#__PURE__*/React.createElement("span", {
  id: "attacks-text"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Attacks & Spellcasting")), /*#__PURE__*/React.createElement("div", {
  id: "equipment"
}, /*#__PURE__*/React.createElement("div", {
  id: "equipment-content"
}, /*#__PURE__*/React.createElement("div", {
  id: "money"
}), /*#__PURE__*/React.createElement("div", {
  id: "equipment-text-container"
}, /*#__PURE__*/React.createElement("span", {
  id: "equipment-text"
}))), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Equipment")), /*#__PURE__*/React.createElement("div", {
  id: "character",
  class: "placeholder"
}), /*#__PURE__*/React.createElement("div", {
  id: "features"
}, /*#__PURE__*/React.createElement("div", {
  id: "features-list",
  class: "list"
}, /*#__PURE__*/React.createElement(ListAddButton, null)), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Features & Traits")));
const $ = mainContent.querySelector;
const moneyDenominations = ["CP", "SP", "EP", "GP", "PP"];
const moneyElement = $("#money");
for (let denom of moneyDenominations) {
  const block = /*#__PURE__*/React.createElement("div", {
    id: "money-" + denom.toLowerCase(),
    class: "money-denom"
  }, /*#__PURE__*/React.createElement("div", {
    class: "money-denom-label-container"
  }, /*#__PURE__*/React.createElement("div", {
    class: "money-denom-label"
  }, denom.toUpperCase())), /*#__PURE__*/React.createElement("div", {
    class: "money-value-container"
  }, /*#__PURE__*/React.createElement("div", {
    class: "money-value"
  })));
  moneyElement.appendChild(block);
}
const statNames = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
for (let statName of statNames) {
  const block = /*#__PURE__*/React.createElement("div", {
    class: "stat",
    id: statName
  }, /*#__PURE__*/React.createElement("div", {
    class: "sectionTitle staticPos"
  }, statName), /*#__PURE__*/React.createElement("div", {
    class: "stat-val ignore-invalid"
  }, /*#__PURE__*/React.createElement("div", null)), /*#__PURE__*/React.createElement("div", {
    class: "stat-mod inherit-invalid"
  }, /*#__PURE__*/React.createElement("div", null)));
  $("#stats").appendChild(block);
}
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
function createProficiency(group, name, stat) {
  const block = /*#__PURE__*/React.createElement("div", {
    class: group + " proficiency",
    id: name
  }, /*#__PURE__*/React.createElement("label", {
    for: name + "Checkbox"
  }, /*#__PURE__*/React.createElement("input", {
    id: name + "Checkbox",
    type: "checkbox",
    name: group + "Checkbox",
    class: group + "Checkbox proficiencyCheckbox",
    disabled: "true"
  }), /*#__PURE__*/React.createElement("div", {
    class: "customCheckbox"
  }), /*#__PURE__*/React.createElement("span", {
    class: group + "Bonus proficiencyBonus"
  }), " ", name, " ", /*#__PURE__*/React.createElement("span", {
    class: "proficiencyBonusStat"
  }, "(", stat.substring(0, 3), ")")));
  $("#" + group).appendChild(block);
  return {
    proficiencyCheckbox: block.getElementsByClassName("proficiencyCheckbox")[0],
    bonus: block.getElementsByClassName("proficiencyBonus")[0]
  };
}
class ListItem {
  constructor(list) {
    const block = /*#__PURE__*/React.createElement("div", {
      class: "list-row"
    }, /*#__PURE__*/React.createElement("div", {
      class: "list-move"
    }, /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null)), /*#__PURE__*/React.createElement("button", {
      class: "list-delete",
      type: "button"
    }, /*#__PURE__*/React.createElement("img", {
      src: "/static/img/trash.png"
    })));
    list.element.insertBefore(block, list.addButton);
  }
}
class Weapon extends ListItem {
  constructor(list, weapon) {
    super(list);
    const block = /*#__PURE__*/React.createElement("div", {
      class: "weapon-content"
    }, /*#__PURE__*/React.createElement("div", {
      class: "weapon-name"
    }, /*#__PURE__*/React.createElement("span", {
      class: "weapon-name-value"
    })), /*#__PURE__*/React.createElement("div", {
      class: "weapon-bonus"
    }, /*#__PURE__*/React.createElement("span", {
      class: "weapon-bonus-value"
    })), /*#__PURE__*/React.createElement("div", {
      class: "weapon-damage"
    }, /*#__PURE__*/React.createElement("span", {
      class: "weapon-damage-value"
    })));
    this.value = {
      name: block.getElementsByClassName("weapon-name-value")[0],
      bonus: block.getElementsByClassName("weapon-bonus-value")[0],
      damage: block.getElementsByClassName("weapon-damage-value")[0]
    };
    this.element.appendChild(block);
  }
}
const weapons = new List(document.getElementById("attacks-table"), characterData.weapons, () => ({
  name: "Name",
  bonus: 0,
  damage: "0 type"
}), Weapon);
class Feature extends ListItem {
  constructor(list, data) {
    super(list);
    const block = /*#__PURE__*/React.createElement("div", {
      class: "feature multi-line-text"
    }, /*#__PURE__*/React.createElement("span", {
      class: "feature-name multi-line-text"
    }, /*#__PURE__*/React.createElement("span", {
      class: "feature-name-text multi-line-text"
    }), /*#__PURE__*/React.createElement("span", {
      class: "feature-uses"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      class: "feature-uses-checkbox default-checkbox"
    }), /*#__PURE__*/React.createElement("span", {
      class: "feature-uses-blank"
    }, "(_ / _)"), /*#__PURE__*/React.createElement("span", {
      class: "feature-uses-value-container"
    }, "(", /*#__PURE__*/React.createElement("span", {
      class: "feature-uses-value"
    }), ")")), ":"), " ", /*#__PURE__*/React.createElement("span", {
      class: "feature-text multi-line-text"
    }));
    this.data = data;
    this.name = block.getElementsByClassName("feature-name-text")[0], this.text = block.getElementsByClassName("feature-text")[0], this.checkbox = block.getElementsByClassName("feature-uses-checkbox")[0];
    // this.usesBlank = block.getElementsByClassName("feature-uses-blank")[0];
    this.usesValue = block.getElementsByClassName("feature-uses-value")[0];
    this.usesContainer = block.getElementsByClassName("feature-uses")[0];
    this.element.appendChild(block);
  }
}
const features = new List(document.getElementById("features-list"), characterData.features, () => ({
  name: "Name",
  text: "Description"
}), Feature);
export const templates = {};
export const character = {
  name: $("#name-value"),
  classAndLevel: $("#classAndLvl"),
  background: $("#background"),
  playerName: $("playerName"),
  race: $("#race"),
  xp: $("#xp"),
  stats: Object.fromEntries(statNames.map(statName => [statName, {
    value: $(`#${statName} .stat-val`),
    modifier: $(`#${statName} .stat-mod`)
  }])),
  inspiration: $("#inspiration"),
  proficiencyBonus: $("#proficiencyBonus"),
  savingThrows: Object.fromEntries(Object.keys(skillToStatMap).map(stat => [stat, createProficiency("savingThrows", stat, stat)])),
  skills: Object.fromEntries(Object.keys(skillToStatMap).sort().map(skill => [skill, createProficiency("skills", skill, skillToStatMap[skill])])),
  // TODO: mirror passive perception
  otherProficiencies: {
    armor: $("#armor-prof"),
    weapons: $("#weapons-prof"),
    tools: $("#tools-prof"),
    languages: $("languages-prof")
  },
  ac: $("#ac"),
  initiative: $("initiative"),
  speed: $("#speed"),
  hp: {
    current: $("currentHp"),
    max: $("maxHpValue"),
    temp: $("temp-hp-value")
  },
  hitDice: {
    current: $("hit-dice-value"),
    max: $("hit-dice-total")
  },
  deathSaves: {
    success: [...main.getElementsByClassName("ds-success")],
    fail: [...main.getElementsByClassName("ds-fail")]
  },
  weapons: {
    addButton: $("#attacks-table .list-add"),
    add(element) {
      $("#attacks-table").insertBefore(element, this.addButton);
    }
  },
  attackText: $("#attacks-text"),
  money: moneyDenominations.map(d => "money-" + d.toLowerCase()).map($),
  equipmentText: $("#equipment-text"),
  features: {
    addButton: $("#features-list .list-add"),
    add(element) {
      $("#features-list").insertBefore(element, this.addButton);
    }
  },
  readOnlyMirror: {
    "skills.perception.bonus": $("#perceptionValue")
  }
};