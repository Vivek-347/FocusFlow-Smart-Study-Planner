# FocusFlow — Full Stack Edition

FocusFlow is a React + Vite study planner with a Node.js/Express API, MySQL persistence, account registration/login, protected user data, task planning, exams, Pomodoro timer, analytics, notes and flashcards.

## Requirements
- Node.js 18+
- MySQL Server and MySQL Workbench (Workbench is optional; MySQL Server must be running)

## 1. Create the database
1. Open MySQL Workbench and connect to your local MySQL server.
2. Open `database/schema.sql` and execute the whole script.

## 2. Configure the backend
In a terminal from the `FocusFlow` project folder:

```bash
cd backend
copy .env.example .env
```

Open `backend/.env` and set your local values. The provided example uses `DB_USER=root` and `DB_PASSWORD=root` because those were supplied for this setup. If your MySQL root account has a different password, update it. Change `JWT_SECRET` to a long random value before using the app beyond local development.

Then install and start the API:

```bash
npm install
npm run dev
```

The API runs on `http://localhost:5000`. Test `http://localhost:5000/api/health`; the response should show `database: connected`.

## 3. Start the React frontend
Open a second terminal at the project root (`FocusFlow`, not the backend folder):

```bash
npm install
copy .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`. Register an account, then sign in.

## Data and security notes
- Passwords are hashed with bcryptjs; plain-text passwords are not stored.
- Each account's workspace is stored separately in MySQL.
- The JWT is kept in browser local storage for this local/student-project implementation. For production, use HTTPS, a strong secret, rate limiting, and consider secure HttpOnly cookies.
- Never commit `backend/.env` or share database passwords publicly. The `.gitignore` excludes the local env file.
- Existing localStorage data is not automatically migrated to a newly created account; the app starts with its sample workspace if no server data exists.

## Main folders
- `src/` — React frontend
- `backend/` — Express API and authentication
- `database/schema.sql` — MySQL schema


## Team Members and Collaboration

FocusFlow was developed collaboratively by a team of three members.

- **Vivek Tawate** — Project integration, backend configuration, database integration, and application development.
- **Aarya Walgaonkar** — Collaborative development, study planner functionality, and application testing.
- **Prasad** — Collaborative development, analytics review, testing, and documentation.

### Development Workflow

- Git and GitHub are used for version control.
- Feature branches are used to organize development work.
- Pull requests support code review and integration.
- Team members contribute through development, testing, debugging, and documentation.

*Responsibilities are summarized according to each member's actual contribution to the project.*