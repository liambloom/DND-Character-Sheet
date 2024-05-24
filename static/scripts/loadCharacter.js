const [ , characterOwner, , characterTitle ] = new URL(location).pathname.split("/");
export const characterApi = `/api/character/${characterOwner}/${characterTitle}`;
export const sharingApi = `/api/character/${characterOwner}/${characterTitle}/sharing`;

const charResponse = await fetch(characterApi);

if (!charResponse.ok) {
    alert(`Error retrieving character data\n${charResponse.status} - ${charResponse.statusText}\n$${res.text()}`);
}
const parsedCharResponse = await charResponse.json();
export const { content: characterData, editPermission, ownerDisplayName, title, linkSharing: initialLinkSharing } = parsedCharResponse;
window.characterData = characterData;