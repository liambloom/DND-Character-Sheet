import React from "./jsx.js";

const res = await fetch("/api/character/myCharacterList");

if (res.status === 401) {
    location.redirect("/login?returnTo" + location.href);
}
else if (res.status !== 200) {
    alert("An unexpected error has occurred");
}

const list = document.getElementById("list");
const characters = await res.json();

for (let character of characters) {
    character.last_modified = new Date(character.last_modified)
}

if (characters.length === 0) {
    list.append(<div style="align-self: center;">You have no characters. Click the + button below to make one!</div>);
}

for (let character of characters.sort((a, b) => b.last_modified.getTime() - a.last_modified.getTime())) {
    const block = <div class="li">
        <a class="content" href={character.title}>
            <div class="title">{character.title}</div>
            <div class="owner">{character.owner_display_name}</div>
            <div class="last-modified">{new Date(character.last_modified).toLocaleString()}</div>
        </a>
        <button class="options">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="optionMenu">
                <input type="button" class="rename" value="Rename"></input>
                <input type="button" class="delete" value="Delete"></input>
            </div>
        </button>
    </div>;

    const options = block.getElementsByClassName("options")[0];
    options.addEventListener("click", () => {
        options.classList.toggle("open");
    });

    block.getElementsByClassName("delete")[0].addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete " + character.title + "?")) {
            const res = await fetch(`/api/character/${character.owner_username}/${character.title}`, { method: "DELETE" });

            if (res.status === 204) {
                block.remove();
            }
            else {
                alert("Failed to delete " + character.title);
            }
        }
    });

    block.getElementsByClassName("rename")[0].addEventListener("click", async () => {
        const title = prompt("New name:");
        const res = await fetch(`/api/character/${character.owner_username}/${character.title}`, { 
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                property: "title",
                value: title,
            }),
        });

        console.log(res.status);

        if (res.status === 204) {
            block.getElementsByClassName("title")[0].innerText = title;
            block.getElementsByClassName("content")[0].href = title;
        }
        else if (res.status >= 400 && res.status < 500) {
            alert("Not renamed because: " + (await res.json()).error);
        }
        else {
            alert("Not renamed due to unexpected error");
        }
    });

    list.append(block);
}

window.addEventListener("click", e => {
    const openMenu = document.querySelector(".options.open");

    if (openMenu && !openMenu.contains(e.target)) {
        openMenu.classList.remove("open");
    }
});

document.getElementById("newCharacter").addEventListener("click", async () => {
    document.documentElement.classList.add("leaving");

    const res = await fetch("/api/character/new", {
        method: "POST"
    });

    if (res.status === 201) {
        location.href = res.headers.get("Location");
    }
    else {
        document.documentElement.classList.remove("leaving");
        alert("An error occurred creating your character");
    }
});