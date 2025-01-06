fetch("/api/user/amILoggedIn")
    .then(res => res.json())
    .then(res => {
        if (res) {
            document.getElementById("signup").style.display = "none";
            document.getElementById("login").innerText = "Go to my character sheets";
        }
    });
console.log("foo");
const frontTitleBox = document.getElementById("front-title-container");
const backTitle = document.getElementById("back-tagline")
const frontTitle = document.getElementById("tagline")
function fixTitleSize() {
    let i;
    for (i = 100; i > 0; i--) {
        frontTitle.style.setProperty("font-size", `${i}px`);
        if (frontTitleBox.scrollHeight === frontTitleBox.clientHeight) {
            break;
        }
    }
    backTitle.style.setProperty("font-size", `${i}px`);
}
fixTitleSize();
window.addEventListener("resize", () => fixTitleSize());