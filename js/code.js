const LOGIN_URL = "/api/login.php";
const REGISTER_URL = "/api/register.php";
const LOGOUT_URL = "/api/logout.php";
const ME_URL = "/api/me.php";


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

    const username = usernameInput
        ? usernameInput.value.trim()
        : "";

    const password = passwordInput
        ? passwordInput.value
        : "";

    setMessage("loginResult", "");

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
         * These values are only for UI convenience.
         *
         * The PHP session is the real authentication mechanism.
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
         * Admin routing will be added when admin.html is built.
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
    const usernameInput =
        document.getElementById("loginName");

    const passwordInput =
        document.getElementById("loginPassword");

    const fullNameInput =
        document.getElementById("fullName");

    const username = usernameInput
        ? usernameInput.value.trim()
        : "";

    const password = passwordInput
        ? passwordInput.value
        : "";

    const fullName = fullNameInput
        ? fullNameInput.value.trim()
        : "";

    setMessage("loginResult", "");

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
 * This name is kept because contacts.html already calls readCookie().
 *
 * It no longer trusts a JavaScript userId cookie.
 *
 * Instead it asks the PHP server which authenticated user owns
 * the current session.
 */
async function readCookie() {
    try {
        const response = await fetch(ME_URL, {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            sessionStorage.clear();
            window.location.href = "index.html";
            return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
            sessionStorage.clear();
            window.location.href = "index.html";
            return;
        }

        const user = data.user;

        sessionStorage.setItem(
            "username",
            user.username || ""
        );

        sessionStorage.setItem(
            "full_name",
            user.full_name || ""
        );

        sessionStorage.setItem(
            "role",
            user.role || "user"
        );

        const userNameElement =
            document.getElementById("userName");

        if (userNameElement) {
            const displayName =
                user.full_name ||
                user.username ||
                "User";

            userNameElement.textContent =
                `Logged in as ${displayName}`;
        }

    } catch (error) {
        console.error(error);

        sessionStorage.clear();
        window.location.href = "index.html";
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