import React from "./jsx.js";
import { DataDisplay, Fraction, List, ListItem, util, editing } from "./reactiveDisplay.js";
import { controlButtons } from "./characterControls.js";
import { statNames, statToSkillMap, skillToStatMap, skillNames, hitDiceTable, contentEditableValue } from "./globalConsts.js";
import { ui } from "./characterUiLayer.js";

export default function({ characterData, ownerDisplayName, title}) {
    // document.getElementById("title").innerText = title;

    // #region Character Data
    const characterName = new DataDisplay({
        element: ui.name,
        property: "name",
        autoResize: true,
    });
    // const ripName = new DataDisplay({
    //     element: document.getElementById("rip-name"),
    //     getDefault: () => characterName.value,
    //     listenTo: [ characterName ],
    //     editable: Editable.NEVER,
    // });
    characterName.addChangeListener((_, str) => document.title = str + " Character Sheet");
    document.title = characterData.name + " Character Sheet";
    
    const characterLevel = classes => classes.reduce((total, c) => total + c.level, 0);
    
    const classAndLvl = new DataDisplay({
        element: ui.classAndLvl,
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
        dataToString: data => data.map(d => `${d["class"]} ${d.level}`).join(" / "),
    });
    
    Object.defineProperty(classAndLvl, "characterLevel", {
        get() {
            return characterLevel(classAndLvl.value);
        },
        enumerable: true,
    });
    
    const background = new DataDisplay({
        element: ui.background,
        property: "background",
    });
    
    const playerName = new DataDisplay({
        element: ui.playerName,
        dataObject: { ownerDisplayName },
        property: "ownerDisplayName",
        editable: Editable.NEVER,
    })
    
    const race = new DataDisplay({
        element: ui.race,
        property: "race",
    });
    
    const alignment = new DataDisplay({
        element: ui.alignment,
        property: "alignment",
    })

    // TODO More`
    
    const xp = new DataDisplay({
        element: ui.xp,
        property: "xp",
        dataFromString: util.unsignedParseInt,
        editable: Editable.ALWAYS,
    });

    const stats = {};

    for (let statName of statNames) {
        stats[statName] = {};
        const stat = ui.stats[statName].stat = new DataDisplay({
            element: ui.stats[statName].value,
            validate: n => n > 0 && n <= 20,
            dataObject: characterData.stats, 
            property: statName, 
            dataFromString: util.betterParseInt,
        });
        const mod = stats[statName].mod = new DataDisplay({
            element: ui.stats[statName].value,
            getDefault: () => Math.floor((stat.value - 10) / 2),
            dataToString: util.signedIntToStr,
            listenTo: [ stat ],
            editable: Editable.NEVER,
        });

        stat.addInvalidationListener((_, isValid) => {
            block.classList[isValid ? "remove" : "add"]("invalid");
        });
    }

    const proficiencyBonus = new DataDisplay({
        element: ui.proficiencyBonus,
        getDefault: () => Math.floor((classAndLvl.characterLevel - 1) / 4) + 2,
        dataToString: n => "+" + n,
        listenTo: [ classAndLvl ],
        editable: Editable.NEVER,
    });

    class Proficiency {
        constructor(group, name, stat) {
            const statMod = stats[stat].mod;
            const bonus = this.bonus = new DataDisplay({
                element: ui[group][name].bonus,
                getDefault: () => statMod.value
                    + (characterData[group].proficiencies.indexOf(name) === -1 ? 0 : proficiencyBonus.value),
                dataObject: characterData[group].bonuses,
                property: name,
                dataToString: util.signedIntToStr,
                dataFromString: util.betterParseInt,
                validate: n => !isNaN(n),
                listenTo: [ statMod, proficiencyBonus ],
            });
    
            const checkbox = this.checkbox = ui[group][name].proficiencyCheckbox;
    
            editing.ui.editingModeInputs.push(checkbox);
    
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
    
    const skills = {};
    for (let skill of skillNames) {
        const skillData = new Proficiency("skills", skill, skillToStatMap[skill]);
        skills[skill] = skillData;
    }

    const passiveSkills = {};
    for (let skill of skillNames) {
        passiveSkills[skill] = new DataDisplay({
            element: ui.passiveSkills[skill],
            getDefault: () => 10 + skills[skill].bonus.value,
            listenTo: [ skills[skill].bonus ],
            editable: Editable.NEVER,
        });
    }
    
    const savingThrows = [];
    for (let stat of statNames) {
        const savingThrowData = new Proficiency("savingThrows", stat, stat);
        savingThrows.push(savingThrowData);
    }

    const inspiration = ui.inspiration;
    if (characterData.inspiration) {
        inspiration.boolValue = true;
    }
    inspiration.addEventListener("change", () => {
        characterData.inspiration = inspiration.boolValue;
        editing.characterChanged();
    });
    editing.ui.alwaysEditingInputs.push(inspiration);

    const ac = new DataDisplay({
        element: ui.ac,
        property: "ac",
        dataFromString: util.unsignedParseInt,
        validate: n => n > 0,
        listenTo: [ stats.Dexterity.mod ],
        autoResize: true,
    });
    const initiative = new DataDisplay({
        element: ui.initiative,
        getDefault: () => stats.Dexterity.mod.value,
        dataToString: util.signedIntToStr,
        editable: Editable.NEVER,
        listenTo: [ stats.Dexterity.mod ],
    });
    const speed = new DataDisplay({
        element: ui.speed,
        property: "speed",
        dataFromString: util.unsignedParseInt,
        validate: n => n > 0,
        autoResize: true,
    });
    const tempHp = new DataDisplay({
        element: ui.hp.temp,
        property: "tempHp",
        dataFromString: util.unsignedParseInt,
        validate: n => n >= 0,
        editable: Editable.ALWAYS,
    });

    function hitDieFromString(str) {
        let [ n, d, err ] = str.split("d");
        if (err || !n || !d) {
            throw new Error();
        }
        return {d: util.unsignedParseInt(d), n: util.unsignedParseInt(n)};
    }
    function hitDieToString(die) {
        return `${die.n}d${die.d}`;
    }
    const hitDiceArgs = {
        dataFromString: str => str.split("+").map(hitDieFromString),
        dataToString: dice => dice.map(hitDieToString).join("+"),
    }
    const totalHitDice = new DataDisplay({
        ...hitDiceArgs,
        element: ui.hitDice.max,
        property: "hitDiceTotal",
        validate: val => val.map(({n}) => n).reduce((sum, v) => sum + v) === classAndLvl.characterLevel,
        getDefault: () => {
            const v = [];
            for (let c of classAndLvl.value) {
                const d = hitDiceTable[c.class.toLowerCase()];
                if (!d) {
                    return null;
                }
                v.push({ n: c.level, d });
            }
            return v;
        },
        listenTo: [ classAndLvl ],
    });
    const hitDice = new DataDisplay({
        ...hitDiceArgs,
        element: ui.hitDice.current,
        property: "hitDice",
        validate: val => {
            const total = totalHitDice.value;
            let i = 0;
            for (let j = 0; j < total.length; j++) {{
                if (i >= val.length) {
                    break;
                }
                if (val[i]?.d === total[j].d && val[i]?.n <= total[j].n) {
                    i++;
                }
            }}
            return i === val.length;
        }, 
        getDefault: () => totalHitDice.value,
        listenTo: [ classAndLvl, totalHitDice ],
        autoResize: true,
    });
    
    const dieAvg = (d, n) => (Math.ceil((d - 1) / 2) + 1) * n;
    const hp = new Fraction(
        { 
            property: "hp",
            element: ui.hp.current
        }, 
        { 
            element: ui.hp.max,
            property: "maxHp", 
            getDefault: () => totalHitDice.value === null ? null : totalHitDice.value[0].d + stats.Constitution.mod.value * classAndLvl.characterLevel 
                + dieAvg(totalHitDice.value[0].d, totalHitDice.value[0].n - 1) + totalHitDice.value.slice(1).map(({d, n}) => dieAvg(d, n)).reduce((sum, v) => sum + v, 0),
            listenTo: [ stats.Constitution.mod, classAndLvl, totalHitDice ],
        }
    );
    
    for (let display of [ac, speed, hp.numerDisplay, hp.denomDisplay, tempHp, hitDice, totalHitDice]) {
        display.addInvalidationListener((_, isValid) => {
            display.element.parentElement.classList[isValid ? "remove" : "add"]("invalid");
        });
    }
}

// ^ Updated
// **************************************************************************************
// v Todo



// // Death stuff is complicated and messy so I am going to comment it out for now and come back
// const newSpellSheetButton = document.getElementById("add-spell-sheet");
// editing.ui.editingModeInputs.push(newSpellSheetButton);

// const deathSaveBoxes = Array.from(document.getElementById("death-saves").getElementsByTagName("input"));
// editing.ui.special.push(...ui.deathSaves.success);
// editing.ui.special.push(...ui.deathSaves.fail);
// const killButton = document.getElementById("kill");
// controlButtons.addButton(killButton, true, false);

// function die() {
//     if (!characterData.dead) {
//         characterData.dead = true;

//         delete characterData.hitDice;
//         hitDice.update();

//         document.body.classList.add("death-animation");
//         const animations = document.getElementById("death-overlay").getAnimations();
//         animations[0].onfinish = () => {
//             document.body.classList.remove("unconscious");
//             document.body.classList.add("dead");
//         };
//         animations[1].onfinish = () => {
//             document.body.classList.remove("death-animation");
//         }
//     }
//     else {
//         document.body.classList.add("dead");
//     }

//     characterData.hp = 0;
//     hp.numerDisplay.update();
//     editing.stopEditing();

//     editing.viewOnlyMode();

//     for (let element of controlButtons.getList(controlButtons.enabledWhileDead, true)) {
//         element.disabled = false;
//     }
// }

// function revive() {
//     characterData.dead = false;
//     document.body.classList.remove("dead");

//     characterData.hp = 1;
//     hp.numerDisplay.update();
//     editing.characterChanged();

//     for (let element of editing.ui.alwaysEditing) {
//         element.contentEditable = contentEditableValue;
//     }
//     for (let element of [...editing.ui.alwaysEditingInputs, ...controlButtons.all]) {
//         element.disabled = false;
//     }
// }

// const reviveButton = document.getElementById("revive");
// reviveButton.addEventListener("click", revive);
// controlButtons.addButton(reviveButton, true, true);
// killButton.addEventListener("click", die);

// function updateConsciousness() {
//     const unconscious = hp.numerDisplay.value === 0;
//     for (let checkbox of deathSaveBoxes) {
//         checkbox.disabled = !unconscious;
//         if (!unconscious) {
//             checkbox.checked = false;
//         }
//     }

//     if (unconscious) {
//         if (!("deathSaves" in characterData)) {
//             characterData.deathSaves = { success: 0, fail: 0 };
//             editing.characterChanged();
//         }
//         document.documentElement.dataset.failedDeathSaves = characterData.deathSaves.fail;
//     }
//     else {
//         if ("deathSaves" in characterData) {
//             delete characterData.deathSaves;
//             editing.characterChanged();
//         }
//         delete document.documentElement.dataset.failedDeathSaves
//     }

//     document.body.classList[unconscious && characterData.deathSaves?.success !== 3 && !characterData.dead 
//         ? "add" : "remove"]("unconscious");
// };
// hp.numerDisplay.addChangeListener(updateConsciousness);
// updateConsciousness();

// class DeathSaves {
//     constructor(type) {
//         this.type = type;

//         this.checkboxes = Array.from(document.getElementById(`ds-${this.type}-counter`).getElementsByTagName("input"));

//         for (let i = 0; i < this.checkboxes.length; i++) {
//             const checkbox = this.checkboxes[i];
//             checkbox.addEventListener("click", () => {
//                 let value = i + 1;//this.checkboxes.findLastIndex(box => box.checked) + 1;
//                 if (value === characterData.deathSaves[type]) {
//                     value--;
//                 }
//                 characterData.deathSaves[type] = value;
//                 editing.characterChanged();
//                 this.update();
//             });
//         }

//         this.update();
//     }

//     update() {
//         if ("deathSaves" in characterData) {
//             for (let i = 0; i < characterData.deathSaves[this.type]; i++) {
//                 this.checkboxes[i].checked = true;
//             }
//             for (let i = characterData.deathSaves[this.type]; i < this.checkboxes.length; i++) {
//                 this.checkboxes[i].checked = false;
//             }
//             if (this.type === "fail") {
//                 if (characterData.deathSaves.fail === 3) {
//                     die();
//                 }
//                 else {  
//                     document.documentElement.dataset.failedDeathSaves = characterData.deathSaves.fail;
//                 }
//             }
//             if (this.type === "success") {
//                 updateConsciousness();
//             }
//         }
//     }
// }
// 
// 
// const successfulDeathSaves = new DeathSaves("success");
// const failedDeathSaves = new DeathSaves("fail");
// if (characterData.dead && characterData.deathSaves?.fail !== 3) {
//     die();
// }

const otherProficiencies = [];
for (let [prof, element] of Object.entries(ui.otherProficiencies)) {
    const display = new DataDisplay({
        element,
        dataObject: characterData.otherProficiencies,
        property: prof,
        allowNewlines: true,
    });
    otherProficiencies.push(display);
}

const attacksText = new DataDisplay({
    element: ui.attacksText,
    property: "attacksText",
    allowNewlines: true,
});

class Weapon extends ListItem {
    constructor(list, weapon) {
        super(list);
        
        const block = <div class="weapon-content">
            <div class="weapon-name"><span class="weapon-name-value"></span></div>
            <div class="weapon-bonus"><span class="weapon-bonus-value"></span></div>
            <div class="weapon-damage"><span class="weapon-damage-value"></span></div>
        </div>;

        this.value = {
            name: new DataDisplay({
                element: block.getElementsByClassName("weapon-name-value")[0],
                dataObject: weapon,
                property: "name",
            }),
            bonus: new DataDisplay({
                element: block.getElementsByClassName("weapon-bonus-value")[0],
                dataObject: weapon,
                property: "bonus",
                dataFromString: util.betterParseInt,
                dataToString: util.signedIntToStr,
                listenTo: [stats.Strength.mod, stats.Dexterity.mod, proficiencyBonus],
            }),
            damage: new DataDisplay({
                element: block.getElementsByClassName("weapon-damage-value")[0],
                dataObject: weapon,
                property: "damage",
                listenTo: [stats.Strength.mod, stats.Dexterity.mod, proficiencyBonus],
            }), 
        };

        this.element.appendChild(block);
    }
}

const weapons = new List(document.getElementById("attacks-table"), characterData.weapons, 
    () => ({ name: "Name", bonus: 0, damage: "0 type" }), Weapon);

const moneyDenominations = ["CP", "SP", "EP", "GP", "PP"];
const moneyElement = document.getElementById("money");
const money = [];
for (let denom of moneyDenominations) {
    const block = <div id={"money-" + denom.toLowerCase()} class="money-denom">
        <div class="money-denom-label-container">
            <div class="money-denom-label">{denom.toUpperCase()}</div>
        </div>
        <div class="money-value-container">
            <div class="money-value"></div>
        </div>
    </div>;

    money.push(new DataDisplay({
        element: block.getElementsByClassName("money-value")[0],
        dataObject: characterData.money,
        property: denom,
        dataFromString: util.unsignedParseInt,
        editable: Editable.ALWAYS,
    }));

    moneyElement.appendChild(block);
}

const equipmentText = new DataDisplay({
    element: document.getElementById("equipment-text"),
    property: "equipmentText",
    allowNewlines: true,
});

class Feature extends ListItem {
    constructor(list, data) {
        super(list);
        const block = <div class="feature multi-line-text">
            <span class="feature-name multi-line-text">
                <span class="feature-name-text multi-line-text"></span><span class="feature-uses">
                    <input type="checkbox" class="feature-uses-checkbox default-checkbox"></input>
                    <span class="feature-uses-blank">(_ / _)</span><span class="feature-uses-value-container">(<span class="feature-uses-value"></span>)</span>
                </span>:</span> <span class="feature-text multi-line-text"></span>
        </div>;

        this.data = data;

        this.name = new DataDisplay({
            element: block.getElementsByClassName("feature-name-text")[0],
            dataObject: data,
            property: "name",
        });

        this.text = new DataDisplay({
            element: block.getElementsByClassName("feature-text")[0],
            dataObject: data,
            property: "text",
            allowNewlines: true,
        });

        this.checkbox = block.getElementsByClassName("feature-uses-checkbox")[0];
        // this.usesBlank = block.getElementsByClassName("feature-uses-blank")[0];
        this.usesValue = block.getElementsByClassName("feature-uses-value")[0];
        this.usesContainer = block.getElementsByClassName("feature-uses")[0];
        
        this.checkbox.checked = "maxUses" in data;
        this.updateFeatureUses();
        this.checkbox.addEventListener("change", () => this.updateFeatureUses());

        editing.ui.editingModeInputs.push(this.checkbox);
        this.checkbox.disabled = !editing.isEditing;

        this.element.appendChild(block);
    }

    updateFeatureUses() {
        if (this.checkbox.checked) {
            if (!this.data.maxUses) {
                this.data.currentUses = 1;
                this.data.maxUses = 1;
            }
            this.uses = new Fraction(this.usesValue, { dataObject: this.data, property: "currentUses" }, { dataObject: this.data, property: "maxUses" });
            this.uses.numerElement.classList.add("multi-line-text");
            this.uses.denomElement.classList.add("multi-line-text");
        }
        else {
            delete this.data.currentUses;
            delete this.data.maxUses;
            if (this.uses) {
                for (let display of [ this.uses.numerDisplay, this.uses.denomDisplay ]) {
                    const index = editing.invalid.indexOf(display);
                    if (index >= 0) {
                        editing.invalid.splice(display, 1);
                    }
                }
            }
            this.usesValue.innerHTML = "";
        }
    }
}

const features = new List(document.getElementById("features-list"), characterData.features, () => ({ name: "Name", text: "Description" }), Feature);
// #endregion

// #region Spellcasting
class Spell {
    static counter = 0;

    constructor(castingClass, level, spellNum) {
        const checkboxName = "spellPreparedCheckbox" + Spell.counter++;
        const block = this.block = <div>
            <label for={checkboxName} class="spell-entry">
                <input id={checkboxName} type="checkbox" name={`level-${level}-spells`} class="spellPrepared" disabled="true"/>
                <div class="customCheckbox"></div>
                <div class="spell-name-container">
                    <span class="spell-name"></span>
                </div>
                <div class="spell-phantom" contentEditable="false">.</div>
            </label>
        </div>

        const dataObject = castingClass.levels[level].spells[spellNum];

        this.name = new DataDisplay({
            element: block.getElementsByClassName("spell-name")[0],
            dataObject,
            property: "name",
        });


        if (level > 0) {
            const checkbox = block.getElementsByClassName("spellPrepared")[0];
            editing.ui.editingModeInputs.push(checkbox);

            checkbox.checked = dataObject.prepared;

            checkbox.addEventListener("input", () => {
                dataObject.prepared = checkbox.checked;
                editing.characterChanged();
            });
        }
    }
}

class SpellLevel {
    constructor(dataObject, level) {
        const block = this.block = <div class={`spell-level ${level ? "" : "cantrips"}`}>
            <div class="spell-level-title">
                <div class="spell-level-label-container">
                    <div class="spell-level-label">{level}</div>
                </div>
                <div class="slots-total-container">
                    <div class="slots-total" data-denom></div>
                </div>
                <div class="slots-expended-outer-container">   
                    <div class="slots-expended-inner-container">
                        <div class="slots-expended" data-numer>{level ? "" : "Cantrips"}</div>
                    </div>
                </div>
            </div>
            <div class="spell-list"></div>
        </div>

        const levelObj = dataObject.levels[level];

        if (level > 0) {
            // new Fraction(
            //     block.getElementsByClassName("spell-level-title")[0], 
            //     { dataObject: characterData.spellSlots[level], property: "expended", getDefault: () => 0/*, listenTo: nHub*/ }, 
            //     { dataObject: characterData.spellSlots[level], property: "total", validate: n => n >= 0/*, listenTo: dHub*/ }
            // );
            SpellLevel.getSlotsSpoke(level, block.getElementsByClassName("spell-level-title")[0]);
        }

        for (let spell = 0; spell < levelObj.spells.length; spell++) {
            const spellObj = new Spell(dataObject, level, spell);
            block.getElementsByClassName("spell-list")[0].appendChild(spellObj.block);
        }
    }

    static hubs = [];

    static getSlotsSpoke(level, element) {
        let nHub, dHub;
        if (this.hubs[level]) {
            nHub = [this.hubs[level].numerDisplay];
            dHub = [this.hubs[level].denomDisplay];
        }
        else {
            nHub = dHub = [];
        }

        const slots = new Fraction(
            element, 
            { dataObject: characterData.spellSlots[level], property: "expended", getDefault: () => 0, listenTo: nHub }, 
            { dataObject: characterData.spellSlots[level], property: "total", validate: n => n >= 0, listenTo: dHub }
        );
        if (this.hubs[level]) {
            this.hubs[level].numerDisplay.listenTo(slots.numerDisplay);
            this.hubs[level].denomDisplay.listenTo(slots.denomDisplay);
        }
        this.hubs[level] ??= slots;
        return slots;
    }
}

class SpellSheet {
    constructor(i) {
        const block = this.block = <div class="page spell-page">
            <header class="page-header">
                <button class="spellsheet-delete" type="button">
                    <img src="/static/img/trash.png"/>
                </button>
                <div class="left-header-banner">
                    <div class="header-banner-back"></div>
                </div>
                <div class="header-labeled-container">
                    <div class="header-large-value-box">
                        <div class="header-large-value-container">
                            <div class="spellcasting-class-value header-large-value"></div>
                        </div>
                    </div>
                    <div class="header-label header-large-label">Spellcasting Class</div>
                </div>
                <div class="header-other spellcasting-header-other">
                    <div>
                        <div class="header-other-contents spellcasting-header-other-contents">
                            <div class="spellcasting-header-value">
                                <div class="spellcasting-ability"></div>
                            </div>
                            <div class="spellcasting-header-value">
                                <div class="spell-save-dc"></div>
                            </div>
                            <div class="spellcasting-header-value">
                                <div class="spell-atk-bonus"></div>
                            </div>
                            <div class="header-label">Spellcasting Ability</div>
                            <div class="header-label">Spell Save DC</div>
                            <div class="header-label">Spell Attack Bonus</div>
                        </div>
                    </div>
                </div>
                <div class="right-header-banner"></div>
            </header>
            <div class="spell-columns">
                <div class="spell-column"></div>
                <div class="spell-column"></div>
                <div class="spell-column"></div>
            </div>
        </div>

        const dataObject = characterData.spellcasting[i];

        new DataDisplay({
            element: block.getElementsByClassName("spellcasting-class-value")[0],
            property: "class",
            dataObject,
        });

        const ability = new DataDisplay({
            element: block.getElementsByClassName("spellcasting-ability")[0],
            property: "ability",
            dataObject: dataObject,
            dataFromString: v => {
                if (!v.length) {
                    throw Error("Empty spellcasting stat");
                }

                v = v.charAt(0).toUpperCase() + v.substring(1).toLowerCase();

                let j = statNames.indexOf(v);
                if (j !== -1) {
                    return v;
                }
                
                j = statNames.map(v => v.substring(0, 3)).indexOf(v);
                if (j !== -1) {
                    return statNames[j];
                }
                else {
                    throw Error(v + " is not a stat");
                }
            },
            dataToString: v => {
                return v.substring(0, 3).toUpperCase();
            }
        });

        new DataDisplay({
            element: block.getElementsByClassName("spell-save-dc")[0],
            getDefault: () => 8 + stats[ability.value].mod.value + proficiencyBonus.value,
            listenTo: [ability, ...Object.values(stats).map(s => s.mod), proficiencyBonus],
            editable: Editable.NEVER,
        });

        new DataDisplay({
            element: block.getElementsByClassName("spell-atk-bonus")[0],
            getDefault: () => stats[ability.value].mod.value + proficiencyBonus.value,
            listenTo: [ability, ...Object.values(stats).map(s => s.mod), proficiencyBonus],
            editable: Editable.NEVER,
            dataToString: util.signedIntToStr,
        });

        const delPage = block.getElementsByClassName("spellsheet-delete")[0];
        editing.ui.editingModeInputs.push(delPage);
        delPage.addEventListener("click", () => {
            characterData.spellcasting.splice(characterData.spellcasting.indexOf(dataObject), 1);
            block.remove();
        });

        for (let level = 0; level <= 9; level++) {
            const levelData = new SpellLevel(dataObject, level);
            
            const column = level <= 2 ? 0 : level <= 5 ? 1 : 2
            block.getElementsByClassName("spell-columns")[0].children[column].appendChild(levelData.block);
        }
    }

    static spellsPerLevel = [9, 13, 13, 13, 13, 9, 9, 9, 7, 7];
    static blank() {
        let r = {
            class: "",
            ability: "Intelligence",
            levels: [],
        };
        for (let level = 0; level <= 9; level++) {
            const o = r.levels[level] = { spells: [] };
            // if (level > 0) {
            //     o.spellSlots = { total: 0, expended: 0 };
            // }
            for (let spell = 0; spell < this.spellsPerLevel[level]; spell++) {
                o.spells.push({ name: "", prepared: false });
            }
        }
        return r;
    }
}

for (let i = 0; i < characterData.spellcasting.length; i++) {
    const sheet = new SpellSheet(i);
    document.getElementsByTagName("main")[0].appendChild(sheet.block);
}

newSpellSheetButton.addEventListener("click", () => {
    const sheet = new SpellSheet(characterData.spellcasting.push(SpellSheet.blank()) - 1);
    document.getElementsByTagName("main")[0].appendChild(sheet.block);
});
// #endregion