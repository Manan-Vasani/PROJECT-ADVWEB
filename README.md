# 🚀 Advanced Web Technology Practicals (PROJECT-ADVWEB)

This repository contains university lab practicals for **Advanced Web Development (SEM-5)**. Each practical builds cumulatively on top of previous practicals.

---

## 📐 Progressive Practical Architecture

Each new practical folder inherits the complete working state of the previous practical and adds the new requirements:

$$\text{Folder } N = (\text{Folder } N-1) + (\text{Practical } N \text{ Features})$$

| Folder | Practical | Core Focus & Features Added |
| :--- | :--- | :--- |
| **[`1/`](./1)** | **Practical 1** | **Base Project**: React + TypeScript component modularity, `Header`, `About`, `Skills`, `Footer`, `NavBar`, props data flow. |
| **[`2/`](./2)** | **Practical 2** | **Routing & State**: Practical 1 + `react-router-dom` multi-page routing (`Home`, `Projects`, `Contact`), `useState` controlled form preview, UI visibility toggle. |
| **[`3/`](./3)** | **Practical 3** | **REST API Integration**: Practical 1 + 2 + GitHub API fetching via `useEffect`, async state handling (`repos`, `loading`, `error`), `<Spinner />`, `<ErrorMessage />`, `<RepoList />`, test error path controls. |
| **[`4/`](./4)** | **Practical 4** | **Node.js & Express RESTful API**: Practical 1, 2 & 3 + Express backend (`server.js`, `task-manager-api`), Request Logging middleware, Global 500 Error Handler, in-memory CRUD routes (`GET`, `POST`, `PUT`, `DELETE`), HTTP status code standards (200, 201, 400, 404, 500), interactive Task Manager UI & automated API test suite (`test-api.js`). |
| **`5/`, `6/`, ...** | **Upcoming** | Always starts from previous folder ($N-1$) and layers the new practical topic on top. |

---

## 🛠️ Tech Stack & Conventions
- **Frontend Framework**: React 19 + TypeScript + Vite
- **Backend Framework**: Node.js + Express (Port 5000)
- **Routing**: `react-router-dom`
- **Styling**: Apple Design System CSS Variables & Tokens (`DESIGN-apple.md`)
- **Package Manager**: npm
