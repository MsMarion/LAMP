const LOGIN_URL = "/api/login.php";
const REGISTER_URL = "/api/register.php";
const LOGOUT_URL = "/api/logout.php";


function setMessage(elementId, message, type = "danger") {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.className = `small fw-semibold text-${type}`;
    element.textContent = message;
}


async function doLogin() {

    const usernameInput = document.getElementById("loginName");
    const passwordInput = document.getElementById("loginPassword");

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    setMessage("loginResult", "", "danger");

    if (!username || !password) {
        setMessage(
            "loginResult",
            "Username and password are required."
        );
        return;
    }

    try {

        const response = await fetch(LOGIN_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            credentials: "same-origin",

            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {

            setMessage(
                "loginResult",
                data.error || "Login failed."
            );

            return;
        }

        /*
         * These values are only for displaying information in the UI.
         *
         * Authentication and authorization are handled by the PHP
         * session on the server.
         */
        sessionStorage.setItem(
            "username",
            data.username || ""
        );

        sessionStorage.setItem(
            "full_name",
            data.full_name || ""
        );

        sessionStorage.setItem(
            "role",
            data.role || "user"
        );

        /*
         * For now all successful logins go to contacts.html.
         *
         * When admin.html is built, we will change this so admins
         * are redirected to the admin dashboard.
         */
        window.location.href = "contacts.html";

    } catch (error) {

        console.error(error);

        setMessage(
            "loginResult",
            "Unable to connect to the server."
        );
    }
}


async function doRegister() {

    const usernameInput = document.getElementById("loginName");
    const passwordInput = document.getElementById("loginPassword");
    const fullNameInput = document.getElementById("fullName");

    const username = usernameInput
        ? usernameInput.value.trim()
        : "";

    const password = passwordInput
        ? passwordInput.value
        : "";

    const fullName = fullNameInput
        ? fullNameInput.value.trim()
        : "";

    setMessage("loginResult", "", "danger");

    if (!fullName || !username || !password) {

        setMessage(
            "loginResult",
            "Full name, username, and password are required."
        );

        return;
    }

    if (username.length < 3) {

        setMessage(
            "loginResult",
            "Username must be at least 3 characters."
        );

        return;
    }

    if (password.length < 8) {

        setMessage(
            "loginResult",
            "Password must be at least 8 characters."
        );

        return;
    }

    try {

        const response = await fetch(REGISTER_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            credentials: "same-origin",

            body: JSON.stringify({
                username: username,
                password: password,
                full_name: fullName
            })
        });

        const data = await response.json();

        if (!response.ok) {

            setMessage(
                "loginResult",
                data.error || "Registration failed."
            );

            return;
        }

        setMessage(
            "loginResult",
            "Account created. Redirecting to login...",
            "success"
        );

        setTimeout(function () {
            window.location.href = "index.html";
        }, 1000);

    } catch (error) {

        console.error(error);

        setMessage(
            "loginResult",
            "Unable to connect to the server."
        );
    }
}


/*
 * contacts.html currently calls readCookie() when it loads.
 *
 * We are keeping the function name for compatibility with the
 * existing page, but authentication is NOT based on cookies created
 * by JavaScript anymore.
 *
 * PHP sessions handle authentication.
 */
function readCookie() {

    const fullName =
        sessionStorage.getItem("full_name") || "";

    const username =
        sessionStorage.getItem("username") || "";

    const userNameElement =
        document.getElementById("userName");

    if (userNameElement) {

        const displayName =
            fullName || username || "User";

        userNameElement.textContent =
            `Logged in as ${displayName}`;
    }
}


async function doLogout() {

    try {

        await fetch(LOGOUT_URL, {
            method: "POST",
            credentials: "same-origin"
        });

    } catch (error) {
        console.error(error);
    }

    sessionStorage.clear();

    window.location.href = "index.html";
}