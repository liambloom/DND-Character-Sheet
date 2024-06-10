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