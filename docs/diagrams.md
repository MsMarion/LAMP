# Diagrams

Mermaid sources for the diagrams in our presentation. GitHub renders these
automatically; edit the code blocks to update them.

## Entity-relationship diagram

Matches [`sql/schema.sql`](../sql/schema.sql). A user owns zero or many
contacts; the foreign key is `ON DELETE RESTRICT`, so users are disabled,
never deleted.

```mermaid
erDiagram
    users ||--o{ contacts : owns
    users {
        INT id PK "UNSIGNED, auto-increment"
        VARCHAR(50) username UK
        VARCHAR(255) email UK "nullable"
        VARCHAR(100) full_name
        VARCHAR(255) password_hash "bcrypt, salted"
        ENUM role "user or admin"
        TINYINT(1) is_disabled "default 0"
        TINYINT(1) must_change_password "default 0"
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    contacts {
        INT id PK "UNSIGNED, auto-increment"
        INT user_id FK "references users.id"
        VARCHAR(100) name
        VARCHAR(30) phone "nullable"
        VARCHAR(255) email "nullable"
        VARCHAR(255) address "nullable"
        TEXT notes "nullable"
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
```

## Login sequence

Matches [`api/login.php`](../api/login.php).

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant L as login.php
    participant D as MySQL
    B->>+L: POST /api/login.php {username, password}
    L->>D: SELECT … FROM users WHERE username = ?
    D-->>L: password_hash, role, is_disabled
    Note right of L: password_verify(password, hash)
    alt wrong username or password
        L-->>B: 401 "Invalid username or password"
    else is_disabled = 1
        L-->>B: 403 "Account disabled. Contact an administrator."
    else valid and active
        Note right of L: session_regenerate_id(), store user_id + role
        L-->>-B: 200 {success, user_id, full_name, role} + cookie
        Note right of B: role picks the page: admin.html or contacts.html
    end
```

## Branch history

Simplified from `git log --graph` (branch-test commits omitted). Four
workstreams ran in parallel and were merged into `final-integration` on 9/28.

```mermaid
gitGraph
    commit id: "9/17"
    branch jacob
    commit id: "9/17 "
    checkout main
    branch Harshitha
    commit id: "9/19"
    checkout main
    branch database-setup
    commit id: "9/23"
    checkout jacob
    merge Harshitha id: "9/23 "
    branch chris-frontend
    commit id: "9/24"
    checkout database-setup
    commit id: "9/26"
    checkout Harshitha
    commit id: "9/27"
    checkout chris-frontend
    branch final-integration
    merge Harshitha id: "9/28"
    merge database-setup id: "·"
    commit id: "+7"
```
