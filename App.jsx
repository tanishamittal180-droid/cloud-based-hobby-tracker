import { useEffect, useMemo, useState } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth, db } from "./firebase";

import "./App.css";


// ======================================================
// HELPER FUNCTIONS
// ======================================================

function formatLocalDate(date) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

function getTodayString() {
  return formatLocalDate(new Date());
}

function getWeekStartString() {
  const date = new Date();

  const day = date.getDay();

  // Monday = first day of week
  const difference = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + difference);

  return formatLocalDate(date);
}

function getCurrentStreak(logs) {
  if (!logs.length) return 0;

  const dates = [
    ...new Set(
      logs
        .map((log) => log.date)
        .filter(Boolean)
    ),
  ].sort((a, b) => b.localeCompare(a));

  if (!dates.length) return 0;

  const todayString = getTodayString();

  if (dates[0] !== todayString) {
    return 0;
  }

  let streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const current = new Date(
      dates[i - 1] + "T00:00:00"
    );

    const previous = new Date(
      dates[i] + "T00:00:00"
    );

    const difference =
      (current - previous) /
      (1000 * 60 * 60 * 24);

    if (difference === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}


// ======================================================
// MAIN APP
// ======================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState("dashboard");

  const [profile, setProfile] = useState(null);

  const [hobbies, setHobbies] = useState([]);
  const [logs, setLogs] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  // ====================================================
  // AUTH STATE
  // ====================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          await loadUserData(currentUser);
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);


  // ====================================================
  // LOAD USER DATA
  // ====================================================

  async function loadUserData(currentUser) {
    try {
      setError("");

      const userRef = doc(
        db,
        "users",
        currentUser.uid
      );

      const userSnapshot =
        await getDocs(
          collection(
            db,
            "users",
            currentUser.uid,
            "hobbies"
          )
        );

      const logSnapshot =
        await getDocs(
          collection(
            db,
            "users",
            currentUser.uid,
            "logs"
          )
        );

      const hobbyData =
        userSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

      const logData =
        logSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

      setHobbies(hobbyData);
      setLogs(logData);

      // Load profile using getDocs on collection would be
      // unnecessary, so use getDoc through a small dynamic import
      // replacement below.
      const profileSnapshot =
        await getDocs(
          collection(db, "users")
        );

      const currentProfile =
        profileSnapshot.docs.find(
          (item) => item.id === currentUser.uid
        );

      if (currentProfile) {
        setProfile({
          id: currentProfile.id,
          ...currentProfile.data(),
        });
      } else {
        const defaultProfile = {
          name:
            currentUser.email?.split("@")[0] ||
            "User",
          email: currentUser.email || "",
          bio: "",
          createdAt: serverTimestamp(),
        };

        await setDoc(
          userRef,
          defaultProfile,
          { merge: true }
        );

        setProfile({
          ...defaultProfile,
          email: currentUser.email || "",
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }


  // ====================================================
  // LOGOUT
  // ====================================================

  async function handleLogout() {
    await signOut(auth);

    setUser(null);
    setProfile(null);
    setHobbies([]);
    setLogs([]);
    setPage("dashboard");
  }


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-box">
          <h2>Hobby Tracker</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }


  // ====================================================
  // AUTH PAGE
  // ====================================================

  if (!user) {
    return <AuthPage />;
  }


  // ====================================================
  // DASHBOARD CALCULATIONS
  // ====================================================

  const totalMinutes = logs.reduce(
    (total, log) =>
      total + Number(log.minutes || 0),
    0
  );

  const totalSessions = logs.length;

  const currentStreak = getCurrentStreak(logs);

  const weekStart = getWeekStartString();
  const today = getTodayString();

  const weeklyLogs = logs.filter(
    (log) =>
      log.date >= weekStart &&
      log.date <= today
  );

  const weeklyMinutes = weeklyLogs.reduce(
    (total, log) =>
      total + Number(log.minutes || 0),
    0
  );

  const weeklySessions = weeklyLogs.length;


  // ====================================================
  // ADD HOBBY
  // ====================================================

  async function addHobby(data) {
    try {
      setError("");
      setMessage("");

      const hobbiesRef = collection(
        db,
        "users",
        user.uid,
        "hobbies"
      );

      const hobbyData = {
        title: data.title.trim(),
        category: data.category.trim(),
        goal_per_week: Number(data.goal_per_week),
        minutes_per_session: Number(
          data.minutes_per_session
        ),
        createdAt: serverTimestamp(),
      };

      const newHobby =
        await addDoc(
          hobbiesRef,
          hobbyData
        );

      setHobbies((previous) => [
        ...previous,
        {
          id: newHobby.id,
          ...hobbyData,
        },
      ]);

      setMessage("Hobby added successfully.");

      setPage("skills");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }


  // ====================================================
  // DELETE HOBBY
  // ====================================================

  async function deleteHobby(hobbyId) {
    const confirmDelete =
      window.confirm(
        "Delete this hobby?"
      );

    if (!confirmDelete) return;

    try {
      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "hobbies",
          hobbyId
        )
      );

      setHobbies((previous) =>
        previous.filter(
          (hobby) =>
            hobby.id !== hobbyId
        )
      );

      setMessage("Hobby deleted.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }


  // ====================================================
  // ADD PRACTICE LOG
  // ====================================================

  async function addPractice(data) {
    try {
      setError("");
      setMessage("");

      const hobby =
        hobbies.find(
          (item) =>
            item.id === data.hobbyId
        );

      if (!hobby) {
        setError(
          "Please select a valid hobby."
        );
        return;
      }

      const logsRef = collection(
        db,
        "users",
        user.uid,
        "logs"
      );

      const logData = {
        hid: data.hobbyId,
        hobbyTitle: hobby.title,
        date: data.date,
        minutes: Number(data.minutes),
        notes: data.notes.trim(),
        createdAt: serverTimestamp(),
      };

      const newLog =
        await addDoc(
          logsRef,
          logData
        );

      setLogs((previous) => [
        ...previous,
        {
          id: newLog.id,
          ...logData,
        },
      ]);

      setMessage(
        "Practice session added successfully."
      );

      setPage("practice");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }


  // ====================================================
  // DELETE PRACTICE
  // ====================================================

  async function deletePractice(logId) {
    const confirmDelete =
      window.confirm(
        "Delete this practice session?"
      );

    if (!confirmDelete) return;

    try {
      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "logs",
          logId
        )
      );

      setLogs((previous) =>
        previous.filter(
          (log) => log.id !== logId
        )
      );

      setMessage(
        "Practice session deleted."
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }


  // ====================================================
  // SAVE PROFILE
  // ====================================================

  async function saveProfile(data) {
    try {
      setError("");
      setMessage("");

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const profileData = {
        name: data.name.trim(),
        email: user.email || "",
        bio: data.bio.trim(),
        createdAt:
          profile?.createdAt ||
          serverTimestamp(),
      };

      await setDoc(
        userRef,
        profileData,
        { merge: true }
      );

      setProfile({
        ...profile,
        ...profileData,
      });

      setMessage(
        "Profile saved successfully."
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }


  // ====================================================
  // NAVIGATION
  // ====================================================

  function navigate(targetPage) {
    setPage(targetPage);
    setMessage("");
    setError("");
  }


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="app-layout">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            🎯
          </div>

          <div>
            <h2>HobbyTrack</h2>
            <span>Cloud Tracker</span>
          </div>
        </div>


        <nav className="sidebar-nav">

          <button
            className={
              page === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("dashboard")
            }
          >
            🏠 Dashboard
          </button>


          <button
            className={
              page === "skills"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("skills")
            }
          >
            🎨 My Skills
          </button>


          <button
            className={
              page === "add-hobby"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("add-hobby")
            }
          >
            ➕ Add Hobby
          </button>


          <button
            className={
              page === "practice"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("practice")
            }
          >
            📝 Practice
          </button>


          <button
            className={
              page === "goals"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("goals")
            }
          >
            🎯 Goals
          </button>


          <button
            className={
              page === "analytics"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("analytics")
            }
          >
            📊 Analytics
          </button>


          <button
            className={
              page === "community"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("community")
            }
          >
            👥 Community
          </button>


          <button
            className={
              page === "profile"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("profile")
            }
          >
            👤 Profile
          </button>

        </nav>


        <div className="sidebar-bottom">

          <div className="user-mini">

            <div className="avatar">
              {(profile?.name ||
                user.email ||
                "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="user-mini-info">
              <strong>
                {profile?.name ||
                  user.email
                    ?.split("@")[0] ||
                  "User"}
              </strong>

              <span>
                {user.email}
              </span>
            </div>

          </div>


          <button
            className="logout-button"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main-content">

        <div className="topbar">

          <div>
            <span className="welcome-small">
              Welcome back 👋
            </span>

            <h1>
              {profile?.name ||
                user.email?.split("@")[0] ||
                "User"}
            </h1>
          </div>

          <div className="topbar-date">
            {new Date().toLocaleDateString(
              "en-IN",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
              }
            )}
          </div>

        </div>


        {/* MESSAGES */}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}


        {/* DASHBOARD */}

        {page === "dashboard" && (
          <DashboardPage
            hobbies={hobbies}
            logs={logs}
            totalMinutes={totalMinutes}
            totalSessions={totalSessions}
            currentStreak={currentStreak}
            weeklyMinutes={weeklyMinutes}
            weeklySessions={weeklySessions}
            navigate={navigate}
          />
        )}


        {/* MY SKILLS */}

        {page === "skills" && (
          <SkillsPage
            hobbies={hobbies}
            logs={logs}
            navigate={navigate}
            deleteHobby={deleteHobby}
          />
        )}


        {/* ADD HOBBY */}

        {page === "add-hobby" && (
          <AddHobbyPage
            addHobby={addHobby}
          />
        )}


        {/* PRACTICE */}

        {page === "practice" && (
          <PracticePage
            hobbies={hobbies}
            logs={logs}
            addPractice={addPractice}
            deletePractice={deletePractice}
          />
        )}


        {/* GOALS */}

        {page === "goals" && (
          <GoalsPage
            hobbies={hobbies}
            logs={logs}
          />
        )}


        {/* ANALYTICS */}

        {page === "analytics" && (
          <AnalyticsPage
            hobbies={hobbies}
            logs={logs}
            totalMinutes={totalMinutes}
            totalSessions={totalSessions}
          />
        )}


        {/* COMMUNITY */}

        {page === "community" && (
          <CommunityPage />
        )}


        {/* PROFILE */}

        {page === "profile" && (
          <ProfilePage
            profile={profile}
            user={user}
            saveProfile={saveProfile}
          />
        )}

      </main>

    </div>
  );
}


// ======================================================
// AUTH PAGE
// ======================================================

function AuthPage() {

  const [mode, setMode] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [name, setName] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function handleSubmit(e) {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      if (mode === "login") {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      } else {

        const result =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        await setDoc(
          doc(
            db,
            "users",
            result.user.uid
          ),
          {
            name:
              name.trim() ||
              email.split("@")[0],
            email,
            bio: "",
            createdAt:
              serverTimestamp(),
          }
        );
      }

    } catch (err) {

      console.error(err);

      if (
        err.code ===
        "auth/invalid-credential"
      ) {
        setError(
          "Invalid email or password."
        );
      } else if (
        err.code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "This email is already registered."
        );
      } else if (
        err.code ===
        "auth/weak-password"
      ) {
        setError(
          "Password should be at least 6 characters."
        );
      } else {
        setError(err.message);
      }

    } finally {

      setLoading(false);

    }
  }


  return (

    <div className="auth-container">

      <div className="auth-card">

        <div className="auth-logo">
          🎯
        </div>

        <h1>HobbyTrack</h1>

        <p className="auth-subtitle">
          Track skills. Build habits. Grow.
        </p>


        {mode === "register" && (

          <div className="form-group">

            <label>Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>

        )}


        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>


          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>


          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          <button
            className="primary-button full-width"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>

        </form>


        <div className="auth-switch">

          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            onClick={() =>
              setMode(
                mode === "login"
                  ? "register"
                  : "login"
              )
            }
          >
            {mode === "login"
              ? "Register"
              : "Login"}
          </button>

        </div>

      </div>

    </div>

  );
}


// ======================================================
// DASHBOARD PAGE
// ======================================================

function DashboardPage({
  hobbies,
  logs,
  totalMinutes,
  totalSessions,
  currentStreak,
  weeklyMinutes,
  weeklySessions,
  navigate,
}) {

  return (

    <div className="page">

      <div className="page-header">

        <div>

          <span className="eyebrow">
            YOUR PROGRESS
          </span>

          <h2>Dashboard</h2>

          <p>
            Keep building your skills one
            session at a time.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate("add-hobby")
          }
        >
          + Add Hobby
        </button>

      </div>


      <div className="stats-grid">

        <StatCard
          icon="🎨"
          title="My Hobbies"
          value={hobbies.length}
        />

        <StatCard
          icon="🔥"
          title="Current Streak"
          value={`${currentStreak} days`}
        />

        <StatCard
          icon="⏱️"
          title="Total Minutes"
          value={totalMinutes}
        />

        <StatCard
          icon="📝"
          title="Sessions"
          value={totalSessions}
        />

      </div>


      <div className="section-title">
        This Week
      </div>


      <div className="stats-grid">

        <StatCard
          icon="📅"
          title="Weekly Sessions"
          value={weeklySessions}
        />

        <StatCard
          icon="⏰"
          title="Weekly Minutes"
          value={weeklyMinutes}
        />

      </div>


      <div className="content-card">

        <div className="card-header">

          <div>
            <h3>My Hobbies</h3>

            <p>
              Your current skills and goals
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              navigate("skills")
            }
          >
            View All
          </button>

        </div>


        {hobbies.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              🎨
            </div>

            <h3>No hobbies yet</h3>

            <p>
              Add your first hobby to start
              tracking your progress.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                navigate("add-hobby")
              }
            >
              Add My First Hobby
            </button>

          </div>

        ) : (

          <div className="mini-hobby-grid">

            {hobbies.slice(0, 4).map(
              (hobby) => {

                const hobbyLogs =
                  logs.filter(
                    (log) =>
                      log.hid === hobby.id
                  );

                return (

                  <div
                    className="mini-hobby-card"
                    key={hobby.id}
                  >

                    <div className="hobby-icon">
                      🎯
                    </div>

                    <h4>
                      {hobby.title}
                    </h4>

                    <span>
                      {hobby.category}
                    </span>

                    <p>
                      Goal:{" "}
                      {hobby.goal_per_week}{" "}
                      sessions/week
                    </p>

                    <p>
                      Practice:{" "}
                      {hobbyLogs.length}{" "}
                      sessions
                    </p>

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>

    </div>

  );
}


// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  icon,
  title,
  value,
}) {

  return (

    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>

        <span>{title}</span>

        <strong>{value}</strong>

      </div>

    </div>

  );
}


// ======================================================
// SKILLS PAGE
// ======================================================

function SkillsPage({
  hobbies,
  logs,
  navigate,
  deleteHobby,
}) {

  return (

    <div className="page">

      <div className="page-header">

        <div>

          <span className="eyebrow">
            SKILLS
          </span>

          <h2>My Skills & Hobbies</h2>

          <p>
            Manage everything you are learning.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate("add-hobby")
          }
        >
          + Add Hobby
        </button>

      </div>


      {hobbies.length === 0 ? (

        <div className="empty-state content-card">

          <div className="empty-icon">
            🎨
          </div>

          <h3>No hobbies added</h3>

          <p>
            Start by adding your first
            hobby or skill.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("add-hobby")
            }
          >
            Add Hobby
          </button>

        </div>

      ) : (

        <div className="hobby-grid">

          {hobbies.map((hobby) => {

            const hobbyLogs =
              logs.filter(
                (log) =>
                  log.hid === hobby.id
              );

            const totalMinutes =
              hobbyLogs.reduce(
                (total, log) =>
                  total +
                  Number(
                    log.minutes || 0
                  ),
                0
              );

            return (

              <div
                className="hobby-card"
                key={hobby.id}
              >

                <div className="hobby-card-top">

                  <div className="hobby-large-icon">
                    🎯
                  </div>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteHobby(
                        hobby.id
                      )
                    }
                  >
                    🗑️
                  </button>

                </div>

                <h3>{hobby.title}</h3>

                <span className="category-tag">
                  {hobby.category}
                </span>

                <div className="hobby-info">

                  <div>
                    <span>Weekly Goal</span>
                    <strong>
                      {hobby.goal_per_week}
                    </strong>
                  </div>

                  <div>
                    <span>Session Time</span>
                    <strong>
                      {hobby.minutes_per_session} min
                    </strong>
                  </div>

                  <div>
                    <span>Sessions</span>
                    <strong>
                      {hobbyLogs.length}
                    </strong>
                  </div>

                  <div>
                    <span>Minutes</span>
                    <strong>
                      {totalMinutes}
                    </strong>
                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}

    </div>

  );
}


// ======================================================
// ADD HOBBY PAGE
// ======================================================

function AddHobbyPage({
  addHobby,
}) {

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [goal, setGoal] =
    useState(3);

  const [minutes, setMinutes] =
    useState(30);

  const [saving, setSaving] =
    useState(false);


  async function submit(e) {

    e.preventDefault();

    if (!title.trim()) return;

    setSaving(true);

    await addHobby({
      title,
      category,
      goal_per_week: goal,
      minutes_per_session: minutes,
    });

    setSaving(false);
  }


  return (

    <div className="page">

      <div className="page-header">

        <div>

          <span className="eyebrow">
            NEW SKILL
          </span>

          <h2>Add Hobby</h2>

          <p>
            Create a new hobby and set your
            weekly practice goal.
          </p>

        </div>

      </div>


      <div className="form-card">

        <form onSubmit={submit}>

          <div className="form-group">

            <label>Hobby / Skill Name</label>

            <input
              type="text"
              placeholder="Example: Guitar"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              required
            />

          </div>


          <div className="form-group">

            <label>Category</label>

            <input
              type="text"
              placeholder="Example: Music"
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              required
            />

          </div>


          <div className="form-row">

            <div className="form-group">

              <label>
                Goal Sessions / Week
              </label>

              <input
                type="number"
                min="1"
                max="14"
                value={goal}
                onChange={(e) =>
                  setGoal(
                    Number(e.target.value)
                  )
                }
              />

            </div>


            <div className="form-group">

              <label>
                Minutes / Session
              </label>

              <input
                type="number"
                min="1"
                value={minutes}
                onChange={(e) =>
                  setMinutes(
                    Number(e.target.value)
                  )
                }
              />

            </div>

          </div>


          <button
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Create Hobby"}
          </button>

        </form>

      </div>

    </div>

  );
}


// ======================================================
// PRACTICE PAGE
// ======================================================

function PracticePage({
  hobbies,
  logs,
  addPractice,
  deletePractice,
}) {

  const [hobbyId, setHobbyId] =
    useState("");

  const [date, setDate] =
    useState(getTodayString());

  const [minutes, setMinutes] =
    useState(30);

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  async function submit(e) {

    e.preventDefault();

    if (!hobbyId) {
      alert("Please select a hobby.");
      return;
    }

    setSaving(true);

    await addPractice({
      hobbyId,
      date,
      minutes,
      notes,
    });

    setSaving(false);

    setNotes("");
  }


  return (

    <div className="page">

      <div className="page-header">

        <div>

          <span className="eyebrow">
            PRACTICE
          </span>

          <h2>Log Practice</h2>

          <p>
            Record your practice sessions
            and keep your streak alive.
          </p>

        </div>

      </div>


      {hobbies.length === 0 ? (

        <div className="empty-state content-card">

          <div className="empty-icon">
            📝
          </div>

          <h3>Add a hobby first</h3>

          <p>
            You need at least one hobby
            before logging practice.
          </p>

        </div>

      ) : (

        <>

          <div className="form-card">

            <form onSubmit={submit}>

              <div className="form-group">

                <label>Choose Hobby</label>

                <select
                  value={hobbyId}
                  onChange={(e) =>
                    setHobbyId(
                      e.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    Select hobby
                  </option>

                  {hobbies.map(
                    (hobby) => (

                      <option
                        value={hobby.id}
                        key={hobby.id}
                      >
                        {hobby.title}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label>Date</label>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Minutes
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={minutes}
                    onChange={(e) =>
                      setMinutes(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label>Notes</label>

                <textarea
                  placeholder="What did you practice today?"
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  rows="4"
                />

              </div>


              <button
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Practice"}
              </button>

            </form>

          </div>


          <div className="section-title">
            Practice History
          </div>


          {logs.length === 0 ? (

            <div className="empty-state content-card">

              <h3>
                No practice sessions yet
              </h3>

              <p>
                Your practice history will
                appear here.
              </p>

            </div>

          ) : (

            <div className="practice-list">

              {[...logs]
                .sort((a, b) =>
                  (b.date || "").localeCompare(
                    a.date || ""
                  )
                )
                .map((log) => (

                  <div
                    className="practice-card"
                    key={log.id}
                  >

                    <div className="practice-date">
                      📅 {log.date}
                    </div>

                    <div className="practice-main">

                      <h3>
                        {log.hobbyTitle}
                      </h3>

                      <p>
                        ⏱️ {log.minutes} minutes
                      </p>

                      {log.notes && (
                        <p className="practice-notes">
                          {log.notes}
                        </p>
                      )}

                    </div>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deletePractice(
                          log.id
                        )
                      }
                    >
                      🗑️
                    </button>

                  </div>

                ))}

            </div>

          )}

        </>

      )}

    </div>

  );
}


// ======================================================
// GOALS PAGE — NEW UPGRADE
// ======================================================

function GoalsPage({
  hobbies,
  logs,
}) {

  const weekStart =
    getWeekStartString();

  const today =
    getTodayString();


  const weeklyLogs =
    logs.filter(
      (log) =>
        log.date >= weekStart &&
        log.date <= today
    );


  const totalWeeklySessions =
    weeklyLogs.length;


  const totalWeeklyMinutes =
    weeklyLogs.reduce(
      (total, log) =>
        total +
        Number(log.minutes || 0),
      0
    );


  const totalTargetSessions =
    hobbies.reduce(
      (total, hobby) =>
        total +
        Number(
          hobby.goal_per_week || 0
        ),
      0
    );


  const totalTargetMinutes =
    hobbies.reduce(
      (total, hobby) =>
        total +
        Number(
          hobby.goal_per_week || 0
        ) *
        Number(
          hobby.minutes_per_session || 0
        ),
      0
    );


  const overallSessionProgress =
    totalTargetSessions > 0
      ? Math.min(
          100,
          Math.round(
            (totalWeeklySessions /
              totalTargetSessions) *
              100
          )
        )
      : 0;


  const overallMinuteProgress =
    totalTargetMinutes > 0
      ? Math.min(
          100,
          Math.round(
            (totalWeeklyMinutes /
              totalTargetMinutes) *
              100
          )
        )
      : 0;


  return (

    <div className="page">

      <div className="page-header">

        <div>

          <span className="eyebrow">
            WEEKLY TARGETS
          </span>

          <h2>My Goals</h2>

          <p>
            Track how close you are to your
            weekly practice targets.
          </p>

        </div>

      </div>


      {/* OVERALL WEEK */}

      <div className="content-card goal-overview">

        <div className="goal-overview-header">

          <div>

            <h3>
              This Week
            </h3>

            <p>
              {weekStart} → {today}
            </p>

          </div>

          <div className="goal-percentage">

            {overallSessionProgress}%

          </div>

        </div>


        <div className="goal-progress-large">

          <div
            className="goal-progress-fill"
            style={{
              width:
                `${overallSessionProgress}%`,
            }}
          />

        </div>


        <div className="goal-overview-stats">

          <div>
            <span>
              Sessions
            </span>

            <strong>
              {totalWeeklySessions}
              {" / "}
              {totalTargetSessions}
            </strong>
          </div>


          <div>
            <span>
              Minutes
            </span>

            <strong>
              {totalWeeklyMinutes}
              {" / "}
              {totalTargetMinutes}
            </strong>
          </div>


          <div>
            <span>
              Time Progress
            </span>

            <strong>
              {overallMinuteProgress}%
            </strong>
          </div>

        </div>

      </div>


      {/* INDIVIDUAL GOALS */}

      <div className="section-title">
        Hobby Goals
      </div>


      {hobbies.length === 0 ? (

        <div className="empty-state content-card">

          <div className="empty-icon">
            🎯
          </div>

          <h3>
            No goals yet
          </h3>

          <p>
            Add a hobby with a weekly goal
            to start tracking progress.
          </p>

        </div>

      ) : (

        <div className="goals-grid">

          {hobbies.map((hobby) => {

            const hobbyWeeklyLogs =
              weeklyLogs.filter(
                (log) =>
                  log.hid === hobby.id
              );


            const sessionsCompleted =
              hobbyWeeklyLogs.length;


            const minutesCompleted =
              hobbyWeeklyLogs.reduce(
                (total, log) =>
                  total +
                  Number(
                    log.minutes || 0
                  ),
                0
              );


            const targetSessions =
              Number(
                hobby.goal_per_week || 0
              );


            const targetMinutes =
              targetSessions *
              Number(
                hobby.minutes_per_session || 0
              );


            const sessionProgress =
              targetSessions > 0
                ? Math.min(
                    100,
                    Math.round(
                      (sessionsCompleted /
                        targetSessions) *
                        100
                    )
                  )
                : 0;


            const minuteProgress =
              targetMinutes > 0
                ? Math.min(
                    100,
                    Math.round(
                      (minutesCompleted /
                        targetMinutes) *
                        100
                    )
                  )
                : 0;


            return (

              <div
                className="goal-card"
                key={hobby.id}
              >

                <div className="goal-card-header">

                  <div className="hobby-large-icon">
                    🎯
                  </div>

                  <div>

                    <h3>
                      {hobby.title}
                    </h3>

                    <span>
                      {hobby.category}
                    </span>

                  </div>

                </div>


                <div className="goal-number">

                  <strong>
                    {sessionsCompleted}
                  </strong>

                  <span>
                    / {targetSessions} sessions
                  </span>

                </div>


                <div className="progress-label">

                  <span>
                    Session Goal
                  </span>

                  <strong>
                    {sessionProgress}%
                  </strong>

                </div>


                <div className="goal-progress">

                  <div
                    className="goal-progress-fill"
                    style={{
                      width:
                        `${sessionProgress}%`,
                    }}
                  />

                </div>


                <div className="goal-details">

                  <div>

                    <span>
                      Weekly Target
                    </span>

                    <strong>
                      {targetSessions} sessions
                    </strong>

                  </div>


                  <div>

                    <span>
                      Completed
                    </span>

                    <strong>
                      {sessionsCompleted}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Target Minutes
                    </span>

                    <strong>
                      {targetMinutes} min
                    </strong>

                  </div>


                  <div>

                    <span>
                      Actual Minutes
                    </span>

                    <strong>
                      {minutesCompleted} min
                    </strong>

                  </div>

                </div>


                <div className="goal-status">

                  {sessionProgress >= 100
                    ? "🏆 Weekly goal completed!"
                    : sessionProgress >= 75
                    ? "🔥 Almost there!"
                    : sessionProgress >= 50
                    ? "💪 Good progress!"
                    : sessionProgress > 0
                    ? "🚀 Keep going!"
                    : "🌱 Start your first session!"}

                </div>


                <div className="progress-label">

                  <span>
                    Time Goal
                  </span>

                  <strong>
                    {minuteProgress}%
                  </strong>

                </div>


                <div className="goal-progress">

                  <div
                    className="goal-progress-fill"
                    style={{
                      width:
                        `${minuteProgress}%`,
                    }}
                  />

                </div>

              </div>

            );

          })}

        </div>

      )}

    </div>

  );
}


// ======================================================
// ANALYTICS PAGE
// ======================================================

function AnalyticsPage({
  hobbies,
  logs,
  totalMinutes,
  totalSessions,
}) {

  return (

    <div className="page">

      <div className="page-header">

        <div>

          <span className="eyebrow">
            INSIGHTS
          </span>

          <h2>Analytics</h2>

          <p>
            Understand your practice activity.
          </p>

        </div>

      </div>


      <div className="stats-grid">

        <StatCard
          icon="⏱️"
          title="Total Minutes"
          value={totalMinutes}
        />

        <StatCard
          icon="📝"
          title="Total Sessions"
          value={totalSessions}
        />

        <StatCard
          icon="🎨"
          title="Active Hobbies"
          value={hobbies.length}
        />

      </div>


      <div className="section-title">
        Practice By Hobby
      </div>


      <div className="analytics-list">

        {hobbies.map((hobby) => {

          const hobbyLogs =
            logs.filter(
              (log) =>
                log.hid === hobby.id
            );

          const minutes =
            hobbyLogs.reduce(
              (total, log) =>
                total +
                Number(
                  log.minutes || 0
                ),
              0
            );

          return (

            <div
              className="analytics-row"
              key={hobby.id}
            >

              <div className="analytics-name">

                <strong>
                  {hobby.title}
                </strong>

                <span>
                  {hobby.category}
                </span>

              </div>


              <div className="analytics-bar">

                <div
                  style={{
                    width:
                      `${Math.min(
                        100,
                        minutes / 2
                      )}%`,
                  }}
                />

              </div>


              <strong>
                {minutes} min
              </strong>

            </div>

          );

        })}

      </div>

    </div>

  );
}


// ======================================================
// COMMUNITY PLACEHOLDER
// ======================================================

function CommunityPage() {

  return (

    <div className="page">

      <div className="page-header">

        <div>

          <span className="eyebrow">
            COMMUNITY
          </span>

          <h2>Community</h2>

          <p>
            Share your progress with other
            hobby learners.
          </p>

        </div>

      </div>


      <div className="empty-state content-card">

        <div className="empty-icon">
          👥
        </div>

        <h3>
          Community coming next
        </h3>

        <p>
          The next upgrade will add
          posts, likes and comments using
          Cloud Firestore.
        </p>

      </div>

    </div>

  );
}


// ======================================================
// PROFILE PAGE
// ======================================================

function ProfilePage({
  profile,
  user,
  saveProfile,
}) {

  const [name, setName] =
    useState(profile?.name || "");

  const [bio, setBio] =
    useState(profile?.bio || "");

  const [saving, setSaving] =
    useState(false);


  useEffect(() => {

    setName(profile?.name || "");
    setBio(profile?.bio || "");

  }, [profile]);


  async function submit(e) {

    e.preventDefault();

    setSaving(true);

    await saveProfile({
      name,
      bio,
    });

    setSaving(false);
  }


  return (

    <div className="page">

      <div className="page-header">

        <div>

          <span className="eyebrow">
            ACCOUNT
          </span>

          <h2>My Profile</h2>

          <p>
            Manage your personal information.
          </p>

        </div>

      </div>


      <div className="form-card">

        <form onSubmit={submit}>

          <div className="profile-avatar">
            {(name ||
              user.email ||
              "U")
              .charAt(0)
              .toUpperCase()}
          </div>


          <div className="form-group">

            <label>Name</label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Your name"
            />

          </div>


          <div className="form-group">

            <label>Email</label>

            <input
              value={user.email || ""}
              disabled
            />

          </div>


          <div className="form-group">

            <label>Bio</label>

            <textarea
              value={bio}
              onChange={(e) =>
                setBio(e.target.value)
              }
              placeholder="Tell us about yourself..."
              rows="5"
            />

          </div>


          <button
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Profile"}
          </button>

        </form>

      </div>

    </div>

  );
}