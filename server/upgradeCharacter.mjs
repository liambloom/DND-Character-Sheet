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
}