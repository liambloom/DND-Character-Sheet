const characterJson = "characters" + new URL(location).pathname + ".json";

(async function() {
    const charResponse = await fetch(characterJson);
    const character = await charResponse.json();

    function save() {
        fetch(characterJson, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(character),
        });
    }

    document.getElementById("save").addEventListener("click", save);

    document.title = character.name + " Character Sheet";
    document.getElementById("name").innerText = character.name;

    for (let stat in character.stats) {
        const block = document.getElementById(stat);
        const valElement = block.getElementsByClassName("stat-val")[0];

        valElement.addEventListener("input", () => {
            if (valElement.innerText === "" || /^(?:20|1?\d)$/.test(valElement.innerText)) {
                block.classList.remove("invalid");
            }
            else {
                block.classList.add("invalid");
            }
        });

        function changeDone() {
            block.classList.remove("invalid");
            if (/^(?:20|1?\d)$/.test(valElement.innerText)) {
                character.stats[stat] = + valElement.innerText;
            }
            else {
                valElement.innerText = character.stats[stat];
            }

            let mod = Math.floor((character.stats[stat] - 10) / 2);
            if (mod > 0) {
                mod = "+" + mod;
            }
            block.getElementsByClassName("stat-mod")[0].innerText = mod;
        }

        valElement.addEventListener("blur", changeDone);
        valElement.addEventListener("keydown", event => {
            // console.log(event.key);
            if (event.key === "Enter" && !(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)) {
                valElement.blur();
            }
        });

        changeDone();
    }
})()