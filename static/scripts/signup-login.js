function getReturnTo() {
    return new URLSearchParams(location.search).get("returnTo");
}

let page;
if (location.pathname === "/login") {
    page = {
        fields: ["name", "password"],
        otherPageName: "signup",
        isSignup: false,
        isLogin: true,
        apiPage: "login",
    };
}
else if (location.pathname === "/signup") {
    page = {
        fields: ["username", "email", "displayName", "password"],
        otherPageName: "login",
        isSignup: true,
        isLogin: false,
        apiPage: "new-user",
    };
}
else {
    throw new Error("This should only be loaded on login and signup pages");
}

const form = document.forms.signup;

form.addEventListener("submit", async event => {
    event.preventDefault();

    const res = await fetch("/api/user/" + page.apiPage, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(page.fields.map(k => [k, form[k].value]))),
    });

    console.log(1)

    console.log(2)

    if (res.ok) {
        console.log(3)
        location.replace(getReturnTo() ?? res.headers.get("Location") ?? (await res.json()).characterList ?? "/");
        console.log(4)
    }
    else if (page.isLogin) {
        const nameError = document.getElementById("name-error");
        const passError = document.getElementById("password-error");
        if (res.status === 404) {
            nameError.innerText = "Username or email does not exist";
            passError.innerText = "";
        }
        else if (res.status === 401) {
            nameError.innerText = "";
            passError.innerText = "Incorrect password";
        }
        else if (confirm("An error occurred. Reloading the page?")) {
            location.reload();
        }
    }
    else {
        const body = await res.json();
        for (let field of page.fields) {
            let msg = body[field] ?? "";
            document.getElementById(field + "-error").innerText = msg;
        }
    }
});

const otherUrl = new URL(location);
otherUrl.pathname = "/" + page.otherPageName;
document.getElementById("signup-login-switch").setAttribute("href", otherUrl.href);