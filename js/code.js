const LOGIN_URL = "/api/login.php";
const REGISTER_URL = "/api/register.php";
const LOGOUT_URL = "/api/logout.php";
const ME_URL = "/api/me.php";

const CONTACT_CREATE_URL = "/api/contacts_create.php";
const CONTACT_LIST_URL = "/api/contacts_list.php";
const CONTACT_UPDATE_URL = "/api/contacts_update.php";
const CONTACT_DELETE_URL = "/api/contacts_delete.php";


let currentContacts = [];


/*
 * Display a message without using browser alert boxes.
 */
function setMessage(elementId, message, type = "danger") {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.className = `small fw-semibold text-${type}`;
    element.textContent = message;
}


/*
 * Safely read JSON responses.
 */
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


/*
 * If a protected API reports that the session is no longer valid,
 * return the user to the login page.
 */
function handleAuthenticationFailure(response) {
    if (response.status === 401 || response.status === 403) {
        sessionStorage.clear();
        window.location.href = "index.html";
        return true;
    }

    return false;
}


/*
 * LOGIN
 */
async function doLogin() {
    const usernameInput =
        document.getElementById("loginName");

    const passwordInput =
        document.getElementById("loginPassword");

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

        /*
         * Admin routing will be added when admin.html exists.
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


/*
 * REGISTRATION
 */
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


/*
 * SESSION CHECK
 *
 * The function name is kept for compatibility with the existing
 * project. Authentication is performed by the PHP session.
 */
async function readCookie() {
    try {
        const response = await fetch(ME_URL, {
            method: "GET",
            credentials: "same-origin"
        });

        if (handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok || !data.success || !data.user) {
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


/*
 * LOGOUT
 */
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


/*
 * ADD CONTACT
 */
async function addContact() {
    const name =
        document.getElementById("contactName")
            .value.trim();

    const phone =
        document.getElementById("contactPhone")
            .value.trim();

    const email =
        document.getElementById("contactEmail")
            .value.trim();

    const address =
        document.getElementById("contactAddress")
            .value.trim();

    const notes =
        document.getElementById("contactNotes")
            .value.trim();

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
                name: name,
                phone: phone,
                email: email,
                address: address,
                notes: notes
            })
        });

        if (handleAuthenticationFailure(response)) {
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
            .reset();

        /*
         * Search for the newly created contact so the user
         * immediately sees the result.
         */
        document.getElementById("searchText").value =
            name;

        await searchContact();

    } catch (error) {
        console.error(error);

        setMessage(
            "contactAddResult",
            "Unable to connect to the server."
        );
    }
}


/*
 * SEARCH CONTACTS
 */
async function searchContact() {
    const searchInput =
        document.getElementById("searchText");

    const query = searchInput
        ? searchInput.value.trim()
        : "";

    setMessage("contactSearchResult", "");

    if (!query) {
        currentContacts = [];

        renderContacts([]);

        setMessage(
            "contactSearchResult",
            "Enter something to search for."
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

        if (handleAuthenticationFailure(response)) {
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

        const word =
            currentContacts.length === 1
                ? "contact"
                : "contacts";

        setMessage(
            "contactSearchResult",
            `Found ${currentContacts.length} ${word}.`,
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


/*
 * DISPLAY CONTACTS
 *
 * DOM methods are used instead of inserting contact information
 * directly into HTML strings.
 */
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
        const column =
            document.createElement("div");

        column.className = "col-12";

        const message =
            document.createElement("p");

        message.className =
            "text-secondary text-center py-4 mb-0";

        message.textContent =
            "No contacts to display.";

        column.appendChild(message);
        list.appendChild(column);

        return;
    }

    contacts.forEach(function (contact) {
        const column =
            document.createElement("div");

        column.className = "col-12 col-md-6";

        const card =
            document.createElement("div");

        card.className =
            "card h-100 border-secondary-subtle";

        const body =
            document.createElement("div");

        body.className = "card-body";

        const header =
            document.createElement("div");

        header.className =
            "d-flex justify-content-between align-items-start gap-3 mb-3";

        const name =
            document.createElement("h3");

        name.className =
            "h5 card-title mb-0";

        name.textContent =
            contact.name || "Unnamed Contact";

        const actions =
            document.createElement("div");

        actions.className =
            "d-flex gap-2";

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


/*
 * Add a contact field to a result card.
 */
function appendContactField(
    parent,
    label,
    value,
    icon
) {
    if (!value) {
        return;
    }

    const row =
        document.createElement("div");

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


/*
 * OPEN EDIT MODAL
 */
function openEditContact(contactId) {
    const contact =
        currentContacts.find(function (item) {
            return Number(item.id) ===
                Number(contactId);
        });

    if (!contact) {
        setMessage(
            "contactSearchResult",
            "Contact could not be found."
        );

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

    const modalElement =
        document.getElementById("editContactModal");

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    modal.show();
}


/*
 * SAVE EDIT
 */
async function saveContactEdit() {
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

    if (!id) {
        setMessage(
            "contactEditResult",
            "Invalid contact."
        );

        return;
    }

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
                id: id,
                name: name,
                phone: phone,
                email: email,
                address: address,
                notes: notes
            })
        });

        if (handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "contactEditResult",
                data.error ||
                    "Unable to update contact."
            );

            return;
        }

        setMessage(
            "contactEditResult",
            "Contact updated successfully.",
            "success"
        );

        /*
         * Wait briefly so the success message is visible,
         * then close the modal and refresh the search.
         */
        setTimeout(async function () {
            const modalElement =
                document.getElementById(
                    "editContactModal"
                );

            const modal =
                bootstrap.Modal.getInstance(
                    modalElement
                );

            if (modal) {
                modal.hide();
            }

            await searchContact();

        }, 400);

    } catch (error) {
        console.error(error);

        setMessage(
            "contactEditResult",
            "Unable to connect to the server."
        );
    }
}


/*
 * DELETE CONTACT
 *
 * Delete confirmation is intentionally used here.
 */
async function deleteContact(
    contactId,
    contactName
) {
    const confirmed = window.confirm(
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

        if (handleAuthenticationFailure(response)) {
            return;
        }

        const data = await getJsonResponse(response);

        if (!response.ok) {
            setMessage(
                "contactSearchResult",
                data.error ||
                    "Unable to delete contact."
            );

            return;
        }

        setMessage(
            "contactSearchResult",
            "Contact deleted successfully.",
            "success"
        );

        await searchContact();

    } catch (error) {
        console.error(error);

        setMessage(
            "contactSearchResult",
            "Unable to connect to the server."
        );
    }
}