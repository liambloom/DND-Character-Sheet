export default function(c) {
    c.spellcasting ??= [];
    c.spellSlots ??= [];
    if (c.spellSlots.length === 0) {
        for (let i = 0; i <= 9; i++) {
            c.spellSlots.push({expended: 0, total: 0});
        }
    }
    for (let sheet of c.spellcasting) {
        for (let i = 1; i <= 9; i++) {
            delete sheet.levels[i].spellSlots;
        }
    }
    c.lifeState ??= c.dead ? "dead" : c.hp > 0 ? "alive" : c.deathSaves.success === 3 ? "stable" : "unstable";
    delete c.dead;
    c.deathSaves ??= { fail: 0, success: 0 };
}