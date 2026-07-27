# 🚀 Practical 3: API Integration and Data Rendering in React

Welcome to **Practical 3**! This project extends the multi-page portfolio built in Practical 1 and Practical 2 by consuming a **public REST API (GitHub API)** in React and managing asynchronous data lifecycle states (**Loading**, **Error**, and **Success**).

---

## 🛠️ Practical 3 Objectives & Features

1. **Consume Public REST API**: Dynamically fetch public repositories using `https://api.github.com/users/<username>/repos`.
2. **`useEffect` Lifecycle Hook**: Trigger the async HTTP `fetch()` request on component mount and when search parameters change.
3. **`useState` Asynchronous State Management**:
   - `repos` (`useState([])`): Stores the fetched array of repository objects.
   - `loading` (`useState(true)`): Tracks in-progress network requests.
   - `error` (`useState(null)`): Captures network failures or non-200 HTTP status errors.
4. **Conditional UI Rendering**:
   - `<Spinner />`: Renders an animated loading indicator while `loading === true`.
   - `<ErrorMessage message={error} />`: Displays a user-friendly error alert box with a retry button when `error !== null`.
   - `<RepoList repos={repos} />`: Maps over the repository dataset and displays the repository `name`, description, language, stars, and direct `html_url` link.
5. **Testing Controls**:
   - **GitHub User Search Bar**: Enables fetching repositories for any public GitHub username.
   - **Error Path Simulator**: Includes a toggle button (**"Test Error State"**) to intentionally break the API endpoint and confirm error state UI rendering as required by the lab syllabus.

---

## 📂 Project Directory Structure

```text
3/
├── node_modules/             # Installed packages (react, react-dom, react-router-dom)
├── public/                   # Static icons & favicons
├── src/                      # Source Code
│   ├── components/           # UI Components
│   │   ├── About.tsx         # About Me section layout
│   │   ├── ErrorMessage.tsx  # [NEW] Error alert component with retry button
│   │   ├── Footer.tsx        # Portfolio footer section
│   │   ├── Header.tsx        # Hero banner
│   │   ├── NavBar.tsx        # React Router NavLink navigation bar
│   │   ├── RepoList.tsx      # [NEW] Repository grid list displaying name & html_url
│   │   ├── Skills.tsx        # Technical skills chart
│   │   └── Spinner.tsx       # [NEW] Animated loading spinner component
│   ├── pages/                # Routed Page Views
│   │   ├── Contact.tsx       # Controlled message form (from Practical 2)
│   │   ├── Home.tsx          # Home page view (Header + About + Skills)
│   │   └── Projects.tsx      # [UPDATED] Practical 3 API Integration page
│   ├── App.css               # Main application & Practical 3 component styles
│   ├── App.tsx               # Route configurations (<Routes>, <Route>)
│   ├── index.css             # Global CSS variables & typography rules
│   └── main.tsx              # React DOM entry point wrapped with <BrowserRouter>
├── package.json              # Dependencies (including react-router-dom)
└── README.md                 # Practical 3 Documentation
```

---

## ⚡ Step-by-Step Practical 3 Logic in `Projects.tsx`

```tsx
// 1. Declare state variables for repos, loading, and error
const [repos, setRepos] = useState<Repository[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);

// 2. useEffect triggers fetch on mount
useEffect(() => {
  setLoading(true);
  setError(null);

  fetch('https://api.github.com/users/JHON-WICK-007/repos')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to fetch repositories`);
      return res.json();
    })
    .then((data) => setRepos(data))
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
}, []);

// 3. Conditional Rendering based on state
if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} onRetry={fetchRepos} />;
return <RepoList repos={repos} />;
```

---

## 💻 How to Run the Project

1. Navigate to directory `3`:
   ```bash
   cd 3
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the browser at `http://localhost:5173` (or the port specified in terminal).
4. Click on **Projects** in the navigation bar to observe the loading spinner and live GitHub repositories!
