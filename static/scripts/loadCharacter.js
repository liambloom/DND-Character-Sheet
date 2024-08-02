import { characterApi, sharingApi } from "./globalConsts.js";
import * as printTheme from "./printTheme.js";
import { setTheme } from "./characterUiLayer.js";
import dataManagerInit from "./character.js"; 

const charResponse = await fetch(characterApi);

if (!charResponse.ok) {
    alert(`Error retrieving character data\n${charResponse.status} - ${charResponse.statusText}\n$${res.text()}`);
}
const parsedCharResponse = await charResponse.json();
export const { content: characterData, editPermission, ownerDisplayName, title, linkSharing: initialLinkSharing } = parsedCharResponse;
window.characterData = characterData;

setTheme(printTheme);
dataManagerInit({ characterData, title, initialLinkSharing });