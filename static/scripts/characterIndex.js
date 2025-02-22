import printTheme from "./printTheme.js";
import { setTheme } from "./characterUiLayer.js";
import dataManagerInit from "./character.js"; 
import { characterData, title, initialLinkSharing, ownerDisplayName } from "./loadCharacter.js";
import "./characterControls.js";

setTheme(printTheme);
dataManagerInit({ characterData, title, ownerDisplayName });