const [ , characterOwner, , characterTitle ] = new URL(location).pathname.split("/");
export const characterApi = `/api/character/${characterOwner}/${characterTitle}`;
export const sharingApi = `/api/character/${characterOwner}/${characterTitle}/sharing`;

const testElement = document.createElement("div");
testElement.setAttribute("contentEditable", "PLAINTEXT-ONLY");
const supportsPlaintextOnly = testElement.contentEditable === "plaintext-only";
export const contentEditableValue = supportsPlaintextOnly ? "plaintext-only" : "true";

export const statToSkillMap = {
    "Strength": ["Athletics"],
    "Dexterity": ["Acrobatics", "Slight of Hand", "Stealth"],
    "Intelligence": ["Arcana", "History", "Investigation", "Nature", "Religion"],
    "Wisdom": ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
    "Charisma": ["Deception", "Intimidation", "Performance", "Persuasion"],
}
export const skillToStatMap = {};
for (let stat in statToSkillMap) {
    // skillNames.push(...statToSkillMap[stat]);
    for (let skill of statToSkillMap[stat]) {
        skillToStatMap[skill] = stat;
    }
}
export const statNames = Object.keys(statToSkillMap);
export const skillNames = Object.keys(skillToStatMap).sort();

export const moneyDenominations = ["CP", "SP", "EP", "GP", "PP"];

export const hitDiceTable = {
    "sorcerer": 6,
    "wizard": 6,
    "artificer": 8,
    "bard": 8,
    "cleric": 8,
    "druid": 8,
    "monk": 8,
    "rogue": 8,
    "warlock": 8,
    "fighter": 10,
    "paladin": 10,
    "ranger": 10,
    "barbarian": 12,
};