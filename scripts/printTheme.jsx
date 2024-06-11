import { statNames, skillNames, skillToStatMap, moneyDenominations } from "./5eData.js";
function ListAddButton() {
    return (
        <button class="list-add" type="button" data-list-add-button>
            <div class="list-add-line"></div>
            <div class="list-plus">
                <div class="list-plus-h"></div>
                <div class="list-plus-v"></div>
            </div>
            <div class="list-add-line"></div>
        </button>
    );
}

function DsCheckbox({ type, index }) {
    return (
        <label>
            <input type="checkbox" name={"ds-" + type} data-character={`deathSaves.${type}[${index}]`} />
            <div class="customCheckbox"></div>
        </label>
    );
}

DsCheckbox({type: "foo"});

function DsCounter({ type }) {
    return (
        <div id={`ds-${type}-counter`} class="ds-counter">
            <div class="ds-line"></div>
            <div class="ds-boxes">
                <DsCheckbox type={type} index="1" />
                <DsCheckbox type={type} index="2" />
                <DsCheckbox type={type} index="3" />
            </div>
        </div>
    );
}

const mainContent = <div id="mainpage" class="page">
    <header class="page-header">
        <div class="left-header-banner">
            <div class="header-banner-back"></div>
        </div>
        <div class="header-labeled-container">
            <div class="header-large-value-box">
                <div class="header-large-value-container">
                    <div id="name-value" class="header-large-value" data-character="name"></div>
                </div>
            </div>
            <div class="header-label header-large-label">Character Name</div>
        </div>
        <div class="header-other">
            <div>
                <div id="main-header-other-contents" class="header-other-contents">
                    <div id="hr1"></div>
                    <div id="hr2"></div>
                    <div id="classAndLvl" data-character="classAndLvl"></div>
                    <div id="background" data-character="background"></div>
                    <div id="playerName" data-character=""></div>
                    <div class="header-label">Class & Level</div>
                    <div class="header-label">Background</div>
                    <div class="header-label">Player Name</div>
                    <div id="race" data-character="race"></div>
                    <div id="alignment"></div>
                    <div id="xp" data-character="xp"></div>
                    <div class="header-label">Race</div>
                    <div class="header-label">Alignment</div>
                    <div class="header-label">Experience Points</div>
                </div>
            </div>
        </div>
        <div class="right-header-banner"></div>
    </header>
    <div id="numbers">
        <div id="stats"></div>
        <div id="right-number-flex">
            <label for="inspiration" id="inspiration-label" class="standaloneLabeledValue">
                <div>
                    <input type="checkbox" id="inspiration" data-character="inspiration" />
                    <div>&check;</div>
                </div>
                <div>
                    <div>
                        Inspiration
                    </div>
                </div>
            </label>
            <div class="standaloneLabeledValue">
                <div>
                    <div id="proficiencyBonus" data-character="proficiencyBonus"></div>
                </div>
                <div>
                    <div>
                        Proficiency Bonus
                    </div>
                </div>
            </div>
            <div id="savingThrowsContainer">
                <div id="savingThrows"></div>
                <span class="sectionTitle staticPos">Saving Throws</span>
            </div>
            <div id="skillContainer">
                <div id="skills"></div>
                <span class="sectionTitle staticPos">Skills</span>
            </div>
        </div>
    </div>
    <div id="lower-proficiencies">
        <div id="perception" class="standaloneLabeledValue">
            <div>
                <div id="perceptionValue" data-character="skills.perception.bonus" data-mirror-type="readonly"></div>
            </div>
            <div>
                <div>Passive Perception</div>
            </div>
        </div>
        <div id="other-proficiencies">
            <div id="other-proficiencies-content">
                <p><span class="prof-type">Armor:</span> <span id="armor-prof" data-character="otherProficiencies.armor"></span></p>
                <p><span class="prof-type">Weapons:</span> <span id="weapons-prof" data-character="otherProficiencies.weapons"></span></p>
                <p><span class="prof-type">Tools:</span> <span id="tools-prof" data-character="otherProficiencies.tools"></span></p>
                <p><span class="prof-type">Languages:</span> <span id="languages-prof" data-character="otherProficiencies.languages"></span></p>
            </div>

            <div class="sectionTitle">Other Proficiencies & Languages</div>
        </div>
    </div>
    <div id="misc">
        <div id="misc-row-1">
            <div id="ac-container">
                <div class="inputLine"><div id="ac" class="ignore-invalid" data-character="ac"></div></div>
                <div class="sectionTitle">Armor Class</div>
            </div>
            <div id="initiative-container">
                <div class="written"><div id="initiative" class="ignore-invalid" data-character="initiative"></div></div>
                <div class="sectionTitle">Initiative</div>
            </div>
            <div id="speed-container">
                <div class="inputLine"><div id="speed" class="ignore-invalid" data-character="speed"></div></div>
                <div class="sectionTitle">Speed</div>
            </div>
        </div>
        <div id="misc-row-2">
            <div id="health">
                <div class="topText inputLine">
                    <span>Hit Point Maximum:&nbsp;</span><span id="maxHpValue" class="ignore-invalid" data-character="hp.max"></span>
                </div>
                <div class="inputLine"><div id="currentHp" class="ignore-invalid"data-character="hp.current"></div></div>
                <div class="sectionTitle">Current Hit Points</div>
            </div>
            <div id="temp-hp">
                <div class="inputLine"><div id="temp-hp-value" class="ignore-invalid" data-character="hp.temp"></div></div>
                <div class="sectionTitle">Temporary Hit Points</div>
            </div>
        </div>
        <div id="misc-row-3">
            <div id="hit-dice">
                <div class="topText inputLine">
                    <span>Total:&nbsp;</span><span id="hit-dice-total" class="ignore-invalid" data-character="hitDice.max"></span>
                </div>
                <div class="inputLine"><div id="hit-dice-value" class="ignore-invalid" data-character="hitDice.current"></div></div>
                <div class="sectionTitle">Hit Dice</div>
            </div>
            <div id="death-saves">
                <div id="death-saves-grid">
                    <div id="ds-success-label" class="ds-label">Successes</div>
                    <DsCounter type="success" />
                    <div id="ds-fail-label" class="ds-label">Failures</div>
                    <DsCounter type="fail" />
                </div>
                <div class="sectionTitle">Death Saves</div>
            </div>
        </div>
    </div>
    <div id="attacks">
        <div id="attacks-header" class="list-header">
            <div class="weapon-name">Name</div>
            <div class="weapon-bonus">Atk Bonus</div>
            <div class="weapon-damage">Damage/Type</div>
        </div>
        <div id="attacks-table" class="list" data-character="weapons">
            <ListAddButton />
        </div>
        <div id="attacks-text-container">
            <span id="attacks-text" data-character="attackText"></span>
        </div>
        <div class="sectionTitle">Attacks & Spellcasting</div>
    </div>
    <div id="equipment">
        <div id="equipment-content">
            <div id="money"></div>
            <div id="equipment-text-container">
                <span id="equipment-text" data-character="equipmentText"></span>
            </div>
        </div>
        <div class="sectionTitle">Equipment</div>
    </div>
    <div id="character" class="placeholder"></div>
    <div id="features">
        <div id="features-list" class="list" data-character="features">
            <ListAddButton />
        </div>
        <div class="sectionTitle">Features & Traits</div>
    </div>
</div>;

const $ = mainContent.querySelector;

const moneyElement = $("#money");
for (let denom of moneyDenominations) {
    const block = <div id={"money-" + denom.toLowerCase()} class="money-denom">
        <div class="money-denom-label-container">
            <div class="money-denom-label">{denom.toUpperCase()}</div>
        </div>
        <div class="money-value-container">
            <div class="money-value" data-character={"money." + denom.toLowerCase()}></div>
        </div>
    </div>;

    moneyElement.appendChild(block);
}

for (let statName of statNames) {
    const block = <div class="stat" id={statName}>
        <div class="sectionTitle staticPos">{statName}</div>
        <div class="stat-val ignore-invalid"><div data-character={`stats.${statName}.value`}></div></div>
        <div class="stat-mod inherit-invalid"><div data-character={`stats.${statName}.modifier`}></div></div>
    </div>
    $("#stats").appendChild(block);
}


function createProficiency(group, name, stat) {
    const block = <div class={group + " proficiency"} id={name}>
        <label for={name + "Checkbox"}><input id={name + "Checkbox"} type="checkbox" name={group + "Checkbox"}
                class={group + "Checkbox proficiencyCheckbox"} disabled="true" data-character={`${group}.${name}.proficiencyCheckbox`} 
                /><div class="customCheckbox"></div><span class={group + "Bonus proficiencyBonus"} data-character={`${group}.${name}.bonus`}></span> {name} <span
            class="proficiencyBonusStat">({stat.substring(0, 3)})</span>
        </label>
    </div>;

    $("#" + group).appendChild(block);

    return {
        proficiencyCheckbox: block.getElementsByClassName("proficiencyCheckbox")[0],
        bonus: block.getElementsByClassName("proficiencyBonus")[0],
    }
}

statNames.forEach(stat => createProficiency("savingThrows", stat, stat))
skillNames.forEach(skill => createProficiency("skills", skill, skillToStatMap[skill]))

class ListItem {
    constructor() {
        this.element = <div class="list-row">
            <div class="list-move">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <button class="list-delete" type="button"><img src="/static/img/trash.png"></img></button>
        </div>;

        this.moveHandle = this.element.getElementsByClassName("list-move")[0];
        this.deleteButton = this.element.getElementsByClassName("list-delete")[0];
    }
}

class Weapon extends ListItem {
    constructor() {
        super();
        
        const block = <div class="weapon-content">
            <div class="weapon-name"><span class="weapon-name-value"></span></div>
            <div class="weapon-bonus"><span class="weapon-bonus-value"></span></div>
            <div class="weapon-damage"><span class="weapon-damage-value"></span></div>
        </div>;

        this.data = {
            name: block.getElementsByClassName("weapon-name-value")[0],
            bonus: block.getElementsByClassName("weapon-bonus-value")[0],
            damage: block.getElementsByClassName("weapon-damage-value")[0],
        };

        this.element.appendChild(block);
    }
}

class Feature extends ListItem {
    constructor() {
        super();
        const block = <div class="feature multi-line-text">
            <span class="feature-name multi-line-text">
                <span class="feature-name-text multi-line-text"></span><span class="feature-uses">
                    <input type="checkbox" class="feature-uses-checkbox default-checkbox"></input>
                    <span class="feature-uses-blank">(_ / _)</span><span class="feature-uses-value-container"
                    >(<span class="feature-uses-value"><span class="current-feature-uses"></span> / <span class="max-feature-uses"></span></span>)</span>
                </span>:</span> <span class="feature-text multi-line-text"></span>
        </div>;

        this.data = {
            name: block.getElementsByClassName("feature-name-text")[0],
            text: block.getElementsByClassName("feature-text")[0],
            checkbox: block.getElementsByClassName("feature-uses-checkbox")[0],
            currentUses: block.getElementsByClassName("feature-uses-value")[0],
            maxUses: block.getElementsByClassName("feature-uses")[0],
        }

        this.element.appendChild(block);
    }
}

const templates = { Weapon, Feature };

export default { mainContent, templates };