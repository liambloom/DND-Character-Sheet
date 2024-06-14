import { statNames, skillNames, skillToStatMap, moneyDenominations } from "./5eData.js";
function ListAddButton() {
  return /*#__PURE__*/React.createElement("button", {
    class: "list-add",
    type: "button",
    "data-list-add-button": true
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
  type,
  index
}) {
  return /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    name: "ds-" + type,
    "data-character": `deathSaves.${type}[${index}]`
  }), /*#__PURE__*/React.createElement("div", {
    class: "customCheckbox"
  }));
}
DsCheckbox({
  type: "foo"
});
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
    type: type,
    index: "1"
  }), /*#__PURE__*/React.createElement(DsCheckbox, {
    type: type,
    index: "2"
  }), /*#__PURE__*/React.createElement(DsCheckbox, {
    type: type,
    index: "3"
  })));
}
const mainContent = /*#__PURE__*/React.createElement("div", {
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
  class: "header-large-value",
  "data-character": "name"
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
  id: "classAndLvl",
  "data-character": "classAndLvl"
}), /*#__PURE__*/React.createElement("div", {
  id: "background",
  "data-character": "background"
}), /*#__PURE__*/React.createElement("div", {
  id: "playerName",
  "data-character": ""
}), /*#__PURE__*/React.createElement("div", {
  class: "header-label"
}, "Class & Level"), /*#__PURE__*/React.createElement("div", {
  class: "header-label"
}, "Background"), /*#__PURE__*/React.createElement("div", {
  class: "header-label"
}, "Player Name"), /*#__PURE__*/React.createElement("div", {
  id: "race",
  "data-character": "race"
}), /*#__PURE__*/React.createElement("div", {
  id: "alignment"
}), /*#__PURE__*/React.createElement("div", {
  id: "xp",
  "data-character": "xp"
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
  id: "inspiration",
  "data-character": "inspiration"
}), /*#__PURE__*/React.createElement("div", null, "&check;")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, "Inspiration"))), /*#__PURE__*/React.createElement("div", {
  class: "standaloneLabeledValue"
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  id: "proficiencyBonus",
  "data-character": "proficiencyBonus"
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
  id: "perceptionValue",
  "data-character": "skills.perception.bonus",
  "data-mirror-type": "readonly"
})), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, "Passive Perception"))), /*#__PURE__*/React.createElement("div", {
  id: "other-proficiencies"
}, /*#__PURE__*/React.createElement("div", {
  id: "other-proficiencies-content"
}, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
  class: "prof-type"
}, "Armor:"), " ", /*#__PURE__*/React.createElement("span", {
  id: "armor-prof",
  "data-character": "otherProficiencies.armor"
})), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
  class: "prof-type"
}, "Weapons:"), " ", /*#__PURE__*/React.createElement("span", {
  id: "weapons-prof",
  "data-character": "otherProficiencies.weapons"
})), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
  class: "prof-type"
}, "Tools:"), " ", /*#__PURE__*/React.createElement("span", {
  id: "tools-prof",
  "data-character": "otherProficiencies.tools"
})), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
  class: "prof-type"
}, "Languages:"), " ", /*#__PURE__*/React.createElement("span", {
  id: "languages-prof",
  "data-character": "otherProficiencies.languages"
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
  class: "ignore-invalid",
  "data-character": "ac"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Armor Class")), /*#__PURE__*/React.createElement("div", {
  id: "initiative-container"
}, /*#__PURE__*/React.createElement("div", {
  class: "written"
}, /*#__PURE__*/React.createElement("div", {
  id: "initiative",
  class: "ignore-invalid",
  "data-character": "initiative"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Initiative")), /*#__PURE__*/React.createElement("div", {
  id: "speed-container"
}, /*#__PURE__*/React.createElement("div", {
  class: "inputLine"
}, /*#__PURE__*/React.createElement("div", {
  id: "speed",
  class: "ignore-invalid",
  "data-character": "speed"
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
  "data-character": "hp.max"
})), /*#__PURE__*/React.createElement("div", {
  class: "inputLine"
}, /*#__PURE__*/React.createElement("div", {
  id: "currentHp",
  class: "ignore-invalid",
  "data-character": "hp.current"
})), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Current Hit Points")), /*#__PURE__*/React.createElement("div", {
  id: "temp-hp"
}, /*#__PURE__*/React.createElement("div", {
  class: "inputLine"
}, /*#__PURE__*/React.createElement("div", {
  id: "temp-hp-value",
  class: "ignore-invalid",
  "data-character": "hp.temp"
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
  "data-character": "hitDice.max"
})), /*#__PURE__*/React.createElement("div", {
  class: "inputLine"
}, /*#__PURE__*/React.createElement("div", {
  id: "hit-dice-value",
  class: "ignore-invalid",
  "data-character": "hitDice.current"
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
  class: "list",
  "data-character": "weapons"
}, /*#__PURE__*/React.createElement(ListAddButton, null)), /*#__PURE__*/React.createElement("div", {
  id: "attacks-text-container"
}, /*#__PURE__*/React.createElement("span", {
  id: "attacks-text",
  "data-character": "attackText"
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
  id: "equipment-text",
  "data-character": "equipmentText"
}))), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Equipment")), /*#__PURE__*/React.createElement("div", {
  id: "character",
  class: "placeholder"
}), /*#__PURE__*/React.createElement("div", {
  id: "features"
}, /*#__PURE__*/React.createElement("div", {
  id: "features-list",
  class: "list",
  "data-character": "features"
}, /*#__PURE__*/React.createElement(ListAddButton, null)), /*#__PURE__*/React.createElement("div", {
  class: "sectionTitle"
}, "Features & Traits")));
const $ = mainContent.querySelector;
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
    class: "money-value",
    "data-character": "money." + denom.toLowerCase()
  })));
  moneyElement.appendChild(block);
}
for (let statName of statNames) {
  const block = /*#__PURE__*/React.createElement("div", {
    class: "stat",
    id: statName
  }, /*#__PURE__*/React.createElement("div", {
    class: "sectionTitle staticPos"
  }, statName), /*#__PURE__*/React.createElement("div", {
    class: "stat-val ignore-invalid"
  }, /*#__PURE__*/React.createElement("div", {
    "data-character": `stats.${statName}.value`
  })), /*#__PURE__*/React.createElement("div", {
    class: "stat-mod inherit-invalid"
  }, /*#__PURE__*/React.createElement("div", {
    "data-character": `stats.${statName}.modifier`
  })));
  $("#stats").appendChild(block);
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
    disabled: "true",
    "data-character": `${group}.${name}.proficiencyCheckbox`
  }), /*#__PURE__*/React.createElement("div", {
    class: "customCheckbox"
  }), /*#__PURE__*/React.createElement("span", {
    class: group + "Bonus proficiencyBonus",
    "data-character": `${group}.${name}.bonus`
  }), " ", name, " ", /*#__PURE__*/React.createElement("span", {
    class: "proficiencyBonusStat"
  }, "(", stat.substring(0, 3), ")")));
  $("#" + group).appendChild(block);
  return {
    proficiencyCheckbox: block.getElementsByClassName("proficiencyCheckbox")[0],
    bonus: block.getElementsByClassName("proficiencyBonus")[0]
  };
}
statNames.forEach(stat => createProficiency("savingThrows", stat, stat));
skillNames.forEach(skill => createProficiency("skills", skill, skillToStatMap[skill]));
class ListItem {
  constructor() {
    this.element = /*#__PURE__*/React.createElement("div", {
      class: "list-row"
    }, /*#__PURE__*/React.createElement("div", {
      class: "list-move"
    }, /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null)), /*#__PURE__*/React.createElement("button", {
      class: "list-delete",
      type: "button"
    }, /*#__PURE__*/React.createElement("img", {
      src: "/static/img/trash.png"
    })));
    this.moveHandle = this.element.getElementsByClassName("list-move")[0];
    this.deleteButton = this.element.getElementsByClassName("list-delete")[0];
  }
}
class Weapon extends ListItem {
  constructor() {
    super();
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
    this.data = {
      name: block.getElementsByClassName("weapon-name-value")[0],
      bonus: block.getElementsByClassName("weapon-bonus-value")[0],
      damage: block.getElementsByClassName("weapon-damage-value")[0]
    };
    this.element.appendChild(block);
  }
}
class Feature extends ListItem {
  constructor() {
    super();
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
    }, /*#__PURE__*/React.createElement("span", {
      class: "current-feature-uses"
    }), " / ", /*#__PURE__*/React.createElement("span", {
      class: "max-feature-uses"
    })), ")")), ":"), " ", /*#__PURE__*/React.createElement("span", {
      class: "feature-text multi-line-text"
    }));
    this.data = {
      name: block.getElementsByClassName("feature-name-text")[0],
      text: block.getElementsByClassName("feature-text")[0],
      checkbox: block.getElementsByClassName("feature-uses-checkbox")[0],
      currentUses: block.getElementsByClassName("feature-uses-value")[0],
      maxUses: block.getElementsByClassName("feature-uses")[0]
    };
    this.element.appendChild(block);
  }
}
const templates = {
  Weapon,
  Feature
};
export default {
  mainContent,
  templates
};