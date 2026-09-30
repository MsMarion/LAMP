const LOGIN_URL = "/api/login.php";
const REGISTER_URL = "/api/register.php";
const LOGOUT_URL = "/api/logout.php";
const ME_URL = "/api/me.php";

const CONTACT_CREATE_URL = "/api/contacts_create.php";
const CONTACT_LIST_URL = "/api/contacts_list.php";
const CONTACT_UPDATE_URL = "/api/contacts_update.php";
const CONTACT_DELETE_URL = "/api/contacts_delete.php";

const ADMIN_USERS_URL = "/api/admin_users_list.php";
const ADMIN_CONTACTS_URL = "/api/admin_contacts_list.php";
const ADMIN_DISABLE_URL = "/api/admin_disable_user.php";
const ADMIN_PASSWORD_URL = "/api/admin_change_password.php";
const ADMIN_CREATE_URL = "/api/admin_create_user.php";

let currentContacts = [];
let currentAdminUsers = [];
let currentAdminId = null;
let authRedirectPending = false;
const pendingActions = new Set();


/* ---------------- GENERAL ---------------- */

function setMessage(elementId, message, type = "danger") {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.className = `small fw-semibold text-${type}`;
    element.textContent = message;
}


async function getJsonResponse(response) {
    try {
        return await response.json();
    } catch (error) {
        return {
            success: false,
            error: "Invalid response from server"
        };
    }
}


// Sends the user to the login page when the session is gone (401) or when an
// admin disabled the account mid-session (403 with code "account_disabled").
// Returns true when it redirected, so the caller should stop.
async function handleAuthenticationFailure(response) {
    if (response.status === 401) {
        redirectToLogin("");
        return true;
    }

    if (response.status === 403) {
        const data = await getJsonResponse(response.clone());

        if (data.code === "account_disabled") {
            redirectToLogin("?disabled=1");
            return true;
        }
    }

    return false;
}


function redirectToLogin(query) {
    authRedirectPending = true;
    sessionStorage.clear();
    window.location.href = `index.html${query}`;
}


// Runs an action at most once at a time (a double-click can't send it twice)
// and disables its button while the request is in flight.
async function runOnce(action, buttonId, work) {
    if (pendingActions.has(action)) {
        return;
    }

    pendingActions.add(action);

    const button = buttonId
        ? document.getElementById(buttonId)
        : null;

    if (button) {
        button.disabled = true;
    }

    try {
        return await work();
    } finally {
        pendingActions.delete(action);

        if (button) {
            button.disabled = false;
        }
    }
}


// On the login page, explain why the user was sent back there.
document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);

    if (params.has("disabled") && document.getElementById("loginResult")) {
        setMessage(
            "loginResult",
            "Your account has been disabled. Contact an administrator."
        );
    }
});


/* ---------------- LOGIN ---------------- */

async function doLogin() {
    return runOnce("login", "loginButton", doLoginNow);
}


async function doLoginNow() {
    const username =
        document.getElementById("loginName")
            ?.value.trim() || "";

    const password =
        document.getElementById("loginPassword")
            ?.value || "";

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
                username,
                password
            })
        });

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "loginResult",
                data.error || "Login failed."
            );

            return;
        }

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

        if (data.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "contacts.html";
        }

    } catch (error) {
        console.error(error);

        setMessage(
            "loginResult",
            "Unable to connect to the server."
        );
    }
}


/* ---------------- REGISTER ---------------- */

async function doRegister() {
    return runOnce("register", "registerButton", doRegisterNow);
}


async function doRegisterNow() {
    const username =
        document.getElementById("loginName")
            ?.value.trim() || "";

    const password =
        document.getElementById("loginPassword")
            ?.value || "";

    const fullName =
        document.getElementById("fullName")
            ?.value.trim() || "";

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
                username,
                password,
                full_name: fullName
            })
        });

        const data = await getJsonResponse(response);

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


/* ---------------- SESSION ---------------- */

async function getCurrentUser() {
    try {
        const response = await fetch(ME_URL, {
            method: "GET",
            credentials: "same-origin"
        });

        if (await handleAuthenticationFailure(response)) {
            return null;
        }

        if (!response.ok) {
            return null;
        }

        const data = await getJsonResponse(response);

        if (!data.success || !data.user) {
            return null;
        }

        return data.user;

    } catch (error) {
        console.error(error);
        return null;
    }
}


async function readCookie() {
    const user = await getCurrentUser();

    if (!user) {
        if (!authRedirectPending) {
            redirectToLogin("");
        }

        return;
    }

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
        userNameElement.textContent =
            `Logged in as ${
                user.full_name ||
                user.username ||
                "User"
            }`;
    }
}


/* ---------------- LOGOUT ---------------- */

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


/* ---------------- CREATE CONTACT ---------------- */

async function addContact() {
    return runOnce("addContact", "addContactButton", addContactNow);
}


async function addContactNow() {
    const name =
        document.getElementById("contactName")
            ?.value.trim() || "";

    const phone =
        document.getElementById("contactPhone")
            ?.value.trim() || "";

    const email =
        document.getElementById("contactEmail")
            ?.value.trim() || "";

    const address =
        document.getElementById("contactAddress")
            ?.value.trim() || "";

    const notes =
        document.getElementById("contactNotes")
            ?.value.trim() || "";

    setMessage("contactAddResult", "");

    if (!name) {
        setMessage(
            "contactAddResult",
            "Contact name is required."
        );

        return;
    }

    try {
        const response = await fetch(CONTACT_CREATE_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            credentials: "same-origin",

            body: JSON.stringify({
                name,
                phone,
                email,
                address,
                notes
            })
        });

        if (await handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "contactAddResult",
                data.error || "Unable to create contact."
            );

            return;
        }

        setMessage(
            "contactAddResult",
            "Contact added successfully.",
            "success"
        );

        document
            .getElementById("addContactForm")
            ?.reset();

        const search =
            document.getElementById("searchText");

        if (search) {
            search.value = name;
        }

        await searchContact();

    } catch (error) {
        console.error(error);

        setMessage(
            "contactAddResult",
            "Unable to connect to the server."
        );
    }
}


/* ---------------- SEARCH CONTACTS ---------------- */

async function searchContact() {
    const query =
        document.getElementById("searchText")
            ?.value.trim() || "";

    setMessage("contactSearchResult", "");

    if (!query) {
        currentContacts = [];
        renderContacts([]);

        setMessage(
            "contactSearchResult",
            "Enter something to search for.",
            "secondary"
        );

        return;
    }

    try {
        const response = await fetch(
            `${CONTACT_LIST_URL}?q=${encodeURIComponent(query)}`,
            {
                method: "GET",
                credentials: "same-origin"
            }
        );

        if (await handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "contactSearchResult",
                data.error || "Unable to search contacts."
            );

            return;
        }

        currentContacts =
            Array.isArray(data.contacts)
                ? data.contacts
                : [];

        renderContacts(currentContacts);

        if (currentContacts.length === 0) {
            setMessage(
                "contactSearchResult",
                "No matching contacts found.",
                "secondary"
            );

            return;
        }

        setMessage(
            "contactSearchResult",
            `Found ${currentContacts.length} ${
                currentContacts.length === 1
                    ? "contact"
                    : "contacts"
            }.`,
            "success"
        );

    } catch (error) {
        console.error(error);

        setMessage(
            "contactSearchResult",
            "Unable to connect to the server."
        );
    }
}


/* ---------------- CONTACT DISPLAY ---------------- */

function renderContacts(contacts) {
    const list =
        document.getElementById("contactList");

    const count =
        document.getElementById("contactCount");

    if (!list) {
        return;
    }

    list.replaceChildren();

    if (count) {
        count.textContent =
            `${contacts.length} ${
                contacts.length === 1
                    ? "contact"
                    : "contacts"
            }`;
    }

    if (contacts.length === 0) {
        const column = document.createElement("div");
        column.className = "col-12";

        const message = document.createElement("p");

        message.className =
            "text-secondary text-center py-4 mb-0";

        message.textContent =
            "No contacts to display.";

        column.appendChild(message);
        list.appendChild(column);

        return;
    }

    contacts.forEach(function (contact) {
        const column = document.createElement("div");
        column.className = "col-12 col-md-6";

        const card = document.createElement("div");
        card.className =
            "card h-100 border-secondary-subtle";

        const body = document.createElement("div");
        body.className = "card-body";

        const header = document.createElement("div");
        header.className =
            "d-flex justify-content-between align-items-start gap-3 mb-3";

        const name = document.createElement("h3");
        name.className = "h5 card-title mb-0";
        name.textContent =
            contact.name || "Unnamed Contact";

        const actions = document.createElement("div");
        actions.className = "d-flex gap-2";

        const editButton =
            document.createElement("button");

        editButton.type = "button";
        editButton.className =
            "btn btn-outline-primary btn-sm";

        editButton.setAttribute(
            "aria-label",
            `Edit ${contact.name}`
        );

        editButton.innerHTML =
            '<i class="bi bi-pencil"></i>';

        editButton.addEventListener(
            "click",
            function () {
                openEditContact(contact.id);
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "btn btn-outline-danger btn-sm";

        deleteButton.setAttribute(
            "aria-label",
            `Delete ${contact.name}`
        );

        deleteButton.innerHTML =
            '<i class="bi bi-trash"></i>';

        deleteButton.addEventListener(
            "click",
            function () {
                deleteContact(
                    contact.id,
                    contact.name
                );
            }
        );

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        header.appendChild(name);
        header.appendChild(actions);

        body.appendChild(header);

        appendContactField(
            body,
            "Phone",
            contact.phone,
            "bi-telephone"
        );

        appendContactField(
            body,
            "Email",
            contact.email,
            "bi-envelope"
        );

        appendContactField(
            body,
            "Address",
            contact.address,
            "bi-geo-alt"
        );

        appendContactField(
            body,
            "Notes",
            contact.notes,
            "bi-sticky"
        );

        card.appendChild(body);
        column.appendChild(card);
        list.appendChild(column);
    });
}


function appendContactField(
    parent,
    label,
    value,
    icon
) {
    if (!value) {
        return;
    }

    const row = document.createElement("div");

    row.className =
        "d-flex align-items-start gap-2 mb-2";

    const iconElement =
        document.createElement("i");

    iconElement.className =
        `bi ${icon} text-secondary mt-1`;

    const content =
        document.createElement("div");

    const labelElement =
        document.createElement("span");

    labelElement.className =
        "small fw-semibold d-block";

    labelElement.textContent = label;

    const valueElement =
        document.createElement("span");

    valueElement.className =
        "small text-secondary";

    valueElement.textContent = value;

    content.appendChild(labelElement);
    content.appendChild(valueElement);

    row.appendChild(iconElement);
    row.appendChild(content);

    parent.appendChild(row);
}


/* ---------------- EDIT CONTACT ---------------- */

function openEditContact(contactId) {
    const contact =
        currentContacts.find(function (item) {
            return Number(item.id) ===
                Number(contactId);
        });

    if (!contact) {
        return;
    }

    document.getElementById("editContactId").value =
        contact.id;

    document.getElementById("editContactName").value =
        contact.name || "";

    document.getElementById("editContactPhone").value =
        contact.phone || "";

    document.getElementById("editContactEmail").value =
        contact.email || "";

    document.getElementById("editContactAddress").value =
        contact.address || "";

    document.getElementById("editContactNotes").value =
        contact.notes || "";

    setMessage("contactEditResult", "");

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "editContactModal"
            )
        );

    modal.show();
}


async function saveContactEdit() {
    return runOnce("saveContactEdit", "saveContactButton", saveContactEditNow);
}


async function saveContactEditNow() {
    const id =
        Number(
            document.getElementById(
                "editContactId"
            ).value
        );

    const name =
        document.getElementById(
            "editContactName"
        ).value.trim();

    const phone =
        document.getElementById(
            "editContactPhone"
        ).value.trim();

    const email =
        document.getElementById(
            "editContactEmail"
        ).value.trim();

    const address =
        document.getElementById(
            "editContactAddress"
        ).value.trim();

    const notes =
        document.getElementById(
            "editContactNotes"
        ).value.trim();

    setMessage("contactEditResult", "");

    if (!name) {
        setMessage(
            "contactEditResult",
            "Contact name is required."
        );

        return;
    }

    try {
        const response = await fetch(CONTACT_UPDATE_URL, {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            credentials: "same-origin",

            body: JSON.stringify({
                id,
                name,
                phone,
                email,
                address,
                notes
            })
        });

        if (await handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "contactEditResult",
                data.error || "Unable to update contact."
            );

            return;
        }

        // Update the card in place instead of re-running the search, so a
        // renamed contact doesn't vanish from a search it no longer matches.
        const index =
            currentContacts.findIndex(function (item) {
                return Number(item.id) === id;
            });

        if (index !== -1) {
            currentContacts[index] = {
                ...currentContacts[index],
                name,
                phone,
                email,
                address,
                notes
            };
        }

        renderContacts(currentContacts);

        setMessage(
            "contactEditResult",
            "Contact updated successfully.",
            "success"
        );

        setTimeout(function () {
            const modal =
                bootstrap.Modal.getInstance(
                    document.getElementById(
                        "editContactModal"
                    )
                );

            if (modal) {
                modal.hide();
            }

            setMessage(
                "contactSearchResult",
                `Saved changes to ${name}.`,
                "success"
            );

        }, 400);

    } catch (error) {
        console.error(error);

        setMessage(
            "contactEditResult",
            "Unable to connect to the server."
        );
    }
}


/* ---------------- DELETE CONTACT ---------------- */

async function deleteContact(
    contactId,
    contactName
) {
    return runOnce(`delete:${contactId}`, null, function () {
        return deleteContactNow(contactId, contactName);
    });
}


async function deleteContactNow(
    contactId,
    contactName
) {
    const confirmed =
        window.confirm(
            `Delete ${contactName}?`
        );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(CONTACT_DELETE_URL, {
            method: "DELETE",

            headers: {
                "Content-Type": "application/json"
            },

            credentials: "same-origin",

            body: JSON.stringify({
                id: Number(contactId)
            })
        });

        if (await handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "contactSearchResult",
                data.error || "Unable to delete contact."
            );

            return;
        }

        // Remove the card in place; re-running the search would clear this message.
        currentContacts =
            currentContacts.filter(function (item) {
                return Number(item.id) !== Number(contactId);
            });

        renderContacts(currentContacts);

        setMessage(
            "contactSearchResult",
            `Deleted ${contactName}.`,
            "success"
        );

    } catch (error) {
        console.error(error);

        setMessage(
            "contactSearchResult",
            "Unable to connect to the server."
        );
    }
}


/* ==================================================
   ADMIN
   ================================================== */


/* ---------------- ADMIN INITIALIZATION ---------------- */

async function initializeAdmin() {
    const user = await getCurrentUser();

    if (!user) {
        if (!authRedirectPending) {
            redirectToLogin("");
        }

        return;
    }

    if (user.role !== "admin") {
        window.location.href = "contacts.html";
        return;
    }

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
        user.role
    );

    const adminName =
        document.getElementById("adminName");

    if (adminName) {
        adminName.textContent =
            `Logged in as ${
                user.full_name ||
                user.username
            } (${user.username})`;
    }

    currentAdminId = Number(user.id);

    // Admins can see all users. Contacts are search-only: the project
    // requires that contact records are never all loaded at once.
    await adminLoadAllUsers();
}


/* ---------------- ADMIN USERS ---------------- */

async function adminLoadAllUsers() {
    const search =
        document.getElementById(
            "adminUserSearch"
        );

    if (search) {
        search.value = "";
    }

    await adminFetchUsers("");
}


async function adminSearchUsers() {
    const query =
        document.getElementById(
            "adminUserSearch"
        )?.value.trim() || "";

    await adminFetchUsers(query);
}


async function adminFetchUsers(query) {
    setMessage("adminUserResult", "");

    try {
        const response = await fetch(
            `${ADMIN_USERS_URL}?q=${encodeURIComponent(query)}`,
            {
                method: "GET",
                credentials: "same-origin"
            }
        );

        if (await handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (response.status === 403) {
            window.location.href = "contacts.html";
            return;
        }

        if (!response.ok) {
            setMessage(
                "adminUserResult",
                data.error || "Unable to retrieve users."
            );

            return;
        }

        currentAdminUsers =
            Array.isArray(data.users)
                ? data.users
                : [];

        renderAdminUsers(currentAdminUsers);

        setMessage(
            "adminUserResult",
            `Found ${currentAdminUsers.length} ${
                currentAdminUsers.length === 1
                    ? "user"
                    : "users"
            }.`,
            "success"
        );

    } catch (error) {
        console.error(error);

        setMessage(
            "adminUserResult",
            "Unable to connect to the server."
        );
    }
}


function renderAdminUsers(users) {
    const table =
        document.getElementById(
            "adminUserTable"
        );

    const count =
        document.getElementById(
            "adminUserCount"
        );

    if (!table) {
        return;
    }

    table.replaceChildren();

    if (count) {
        count.textContent =
            `${users.length} ${
                users.length === 1
                    ? "user"
                    : "users"
            }`;
    }

    if (users.length === 0) {
        const row =
            document.createElement("tr");

        const cell =
            document.createElement("td");

        cell.colSpan = 6;
        cell.className =
            "text-center text-secondary py-4";

        cell.textContent =
            "No users found.";

        row.appendChild(cell);
        table.appendChild(row);

        return;
    }

    users.forEach(function (user) {
        const row =
            document.createElement("tr");

        const username =
            document.createElement("td");

        username.textContent =
            user.username || "";

        const name =
            document.createElement("td");

        name.textContent =
            user.full_name || "";

        const role =
            document.createElement("td");

        const roleBadge =
            document.createElement("span");

        roleBadge.className =
            user.role === "admin"
                ? "badge text-bg-primary"
                : "badge text-bg-secondary";

        roleBadge.textContent =
            user.role || "user";

        role.appendChild(roleBadge);


        const contacts =
            document.createElement("td");

        contacts.textContent =
            String(user.contact_count ?? 0);


        const status =
            document.createElement("td");

        const statusBadge =
            document.createElement("span");

        statusBadge.className =
            user.is_disabled
                ? "badge text-bg-danger"
                : "badge text-bg-success";

        statusBadge.textContent =
            user.is_disabled
                ? "Disabled"
                : "Active";

        status.appendChild(statusBadge);


        const actions =
            document.createElement("td");

        const actionWrapper =
            document.createElement("div");

        actionWrapper.className =
            "d-flex flex-wrap gap-2";


        const toggleButton =
            document.createElement("button");

        toggleButton.type = "button";

        toggleButton.className =
            user.is_disabled
                ? "btn btn-success btn-sm"
                : "btn btn-outline-danger btn-sm";

        toggleButton.textContent =
            user.is_disabled
                ? "Enable"
                : "Disable";

        toggleButton.addEventListener(
            "click",
            function () {
                adminToggleUser(
                    user.id,
                    !user.is_disabled
                );
            }
        );

        // An admin can't disable their own account (the server refuses too).
        if (Number(user.id) === currentAdminId && !user.is_disabled) {
            toggleButton.disabled = true;
            toggleButton.title = "You can't disable your own account";
            username.textContent = `${user.username} (you)`;
        }


        const passwordButton =
            document.createElement("button");

        passwordButton.type = "button";
        passwordButton.className =
            "btn btn-outline-warning btn-sm";

        passwordButton.textContent =
            "Password";

        passwordButton.addEventListener(
            "click",
            function () {
                openAdminPasswordModal(
                    user.id,
                    user.username
                );
            }
        );


        actionWrapper.appendChild(
            toggleButton
        );

        actionWrapper.appendChild(
            passwordButton
        );

        actions.appendChild(
            actionWrapper
        );


        row.appendChild(username);
        row.appendChild(name);
        row.appendChild(role);
        row.appendChild(contacts);
        row.appendChild(status);
        row.appendChild(actions);

        table.appendChild(row);
    });
}


/* ---------------- ENABLE / DISABLE ---------------- */

async function adminToggleUser(
    userId,
    disabled
) {
    return runOnce(`toggle:${userId}`, null, function () {
        return adminToggleUserNow(userId, disabled);
    });
}


async function adminToggleUserNow(
    userId,
    disabled
) {
    setMessage("adminUserResult", "");

    try {
        const response = await fetch(
            ADMIN_DISABLE_URL,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({
                    user_id: Number(userId),
                    is_disabled: disabled
                })
            }
        );

        if (await handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "adminUserResult",
                data.error ||
                    "Unable to update user."
            );

            return;
        }

        // Refresh first: the refresh clears the message area.
        await adminSearchUsers();

        setMessage(
            "adminUserResult",
            data.message ||
                "User updated successfully.",
            "success"
        );

    } catch (error) {
        console.error(error);

        setMessage(
            "adminUserResult",
            "Unable to connect to the server."
        );
    }
}


/* ---------------- PASSWORD MODAL ---------------- */

function openAdminPasswordModal(
    userId,
    username
) {
    document.getElementById(
        "adminPasswordUserId"
    ).value = userId;

    document.getElementById(
        "adminPasswordUsername"
    ).textContent = username;

    document.getElementById(
        "adminNewPassword"
    ).value = "";

    setMessage(
        "adminPasswordResult",
        ""
    );

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "adminPasswordModal"
            )
        );

    modal.show();
}


async function adminChangePassword() {
    return runOnce("adminChangePassword", "adminPasswordButton", adminChangePasswordNow);
}


async function adminChangePasswordNow() {
    const userId =
        Number(
            document.getElementById(
                "adminPasswordUserId"
            ).value
        );

    const newPassword =
        document.getElementById(
            "adminNewPassword"
        ).value;

    setMessage(
        "adminPasswordResult",
        ""
    );

    if (newPassword.length < 8) {
        setMessage(
            "adminPasswordResult",
            "Password must be at least 8 characters."
        );

        return;
    }

    try {
        const response = await fetch(
            ADMIN_PASSWORD_URL,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({
                    user_id: userId,
                    new_password: newPassword
                })
            }
        );

        if (await handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "adminPasswordResult",
                data.error ||
                    "Unable to change password."
            );

            return;
        }

        setMessage(
            "adminPasswordResult",
            "Password changed successfully.",
            "success"
        );

        setTimeout(function () {
            const modal =
                bootstrap.Modal.getInstance(
                    document.getElementById(
                        "adminPasswordModal"
                    )
                );

            if (modal) {
                modal.hide();
            }

        }, 500);

    } catch (error) {
        console.error(error);

        setMessage(
            "adminPasswordResult",
            "Unable to connect to the server."
        );
    }
}


/* ---------------- CREATE USER ---------------- */

async function adminCreateUser() {
    return runOnce("adminCreateUser", "adminCreateButton", adminCreateUserNow);
}


async function adminCreateUserNow() {
    const fullName =
        document.getElementById(
            "adminCreateFullName"
        ).value.trim();

    const username =
        document.getElementById(
            "adminCreateUsername"
        ).value.trim();

    const password =
        document.getElementById(
            "adminCreatePassword"
        ).value;

    const role =
        document.getElementById(
            "adminCreateRole"
        ).value;

    setMessage(
        "adminCreateResult",
        ""
    );

    if (
        !fullName ||
        !username ||
        !password ||
        !role
    ) {
        setMessage(
            "adminCreateResult",
            "All fields are required."
        );

        return;
    }

    if (password.length < 8) {
        setMessage(
            "adminCreateResult",
            "Password must be at least 8 characters."
        );

        return;
    }

    try {
        const response = await fetch(
            ADMIN_CREATE_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({
                    username,
                    full_name: fullName,
                    password,
                    role
                })
            }
        );

        if (await handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "adminCreateResult",
                data.error ||
                    "Unable to create account."
            );

            return;
        }

        setMessage(
            "adminCreateResult",
            `${role === "admin"
                ? "Administrator"
                : "User"} created successfully.`,
            "success"
        );

        document.getElementById(
            "adminCreateUserForm"
        ).reset();

        await adminLoadAllUsers();

    } catch (error) {
        console.error(error);

        setMessage(
            "adminCreateResult",
            "Unable to connect to the server."
        );
    }
}


/* ---------------- ADMIN CONTACT SEARCH ---------------- */

async function adminSearchContacts() {
    const query =
        document.getElementById(
            "adminContactSearch"
        )?.value.trim() || "";

    if (!query) {
        renderAdminContacts([]);

        setMessage(
            "adminContactResult",
            "Enter something to search for.",
            "secondary"
        );

        return;
    }

    await adminFetchContacts(query);
}


async function adminFetchContacts(query) {
    setMessage(
        "adminContactResult",
        ""
    );

    try {
        const response = await fetch(
            `${ADMIN_CONTACTS_URL}?q=${encodeURIComponent(query)}`,
            {
                method: "GET",
                credentials: "same-origin"
            }
        );

        if (await handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (response.status === 403) {
            window.location.href =
                "contacts.html";

            return;
        }

        if (!response.ok) {
            setMessage(
                "adminContactResult",
                data.error ||
                    "Unable to retrieve contacts."
            );

            return;
        }

        const contacts =
            Array.isArray(data.contacts)
                ? data.contacts
                : [];

        renderAdminContacts(contacts);

        setMessage(
            "adminContactResult",
            `Found ${contacts.length} ${
                contacts.length === 1
                    ? "contact"
                    : "contacts"
            }.`,
            "success"
        );

    } catch (error) {
        console.error(error);

        setMessage(
            "adminContactResult",
            "Unable to connect to the server."
        );
    }
}


function renderAdminContacts(contacts) {
    const list =
        document.getElementById(
            "adminContactList"
        );

    const count =
        document.getElementById(
            "adminContactCount"
        );

    if (!list) {
        return;
    }

    list.replaceChildren();

    if (count) {
        count.textContent =
            `${contacts.length} ${
                contacts.length === 1
                    ? "contact"
                    : "contacts"
            }`;
    }

    if (contacts.length === 0) {
        const column =
            document.createElement("div");

        column.className = "col-12";

        const message =
            document.createElement("p");

        message.className =
            "text-center text-secondary py-4";

        message.textContent =
            "No contacts found.";

        column.appendChild(message);
        list.appendChild(column);

        return;
    }

    contacts.forEach(function (contact) {
        const column =
            document.createElement("div");

        column.className =
            "col-12 col-md-6 col-xl-4";

        const card =
            document.createElement("div");

        card.className =
            "card h-100 border-secondary-subtle";

        const body =
            document.createElement("div");

        body.className =
            "card-body";

        const name =
            document.createElement("h3");

        name.className =
            "h5 card-title";

        name.textContent =
            contact.name ||
            "Unnamed Contact";

        body.appendChild(name);


        const owner =
            document.createElement("p");

        owner.className =
            "small mb-3";

        const ownerLabel =
            document.createElement("span");

        ownerLabel.className =
            "badge text-bg-primary me-2";

        ownerLabel.textContent =
            "Owner";

        const ownerText =
            document.createElement("span");

        ownerText.textContent =
            `${contact.owner_name || ""} (${contact.username || ""})`;

        owner.appendChild(ownerLabel);
        owner.appendChild(ownerText);

        body.appendChild(owner);


        appendContactField(
            body,
            "Phone",
            contact.phone,
            "bi-telephone"
        );

        appendContactField(
            body,
            "Email",
            contact.email,
            "bi-envelope"
        );

        appendContactField(
            body,
            "Address",
            contact.address,
            "bi-geo-alt"
        );

        appendContactField(
            body,
            "Notes",
            contact.notes,
            "bi-sticky"
        );

        card.appendChild(body);
        column.appendChild(card);
        list.appendChild(column);
    });
}