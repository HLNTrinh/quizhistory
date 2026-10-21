import { useEffect, useState } from "react";
import BrandMark from "./components/BrandMark.jsx";
import { api, readToken } from "./lib/api.js";
import HomePage from "./pages/home/HomePage.jsx";
import LeaderboardPage from "./pages/user/LeaderboardPage.jsx";
import LoginPage from "./pages/user/LoginPage.jsx";
import PackagesPage from "./pages/user/PackagesPage.jsx";
import ProfilePage from "./pages/user/ProfilePage.jsx";
import StudyHomePage from "./pages/user/StudyHomePage.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", syncPathname);
    return () => window.removeEventListener("popstate", syncPathname);
  }, []);

  function navigate(path) {
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setPathname(path);
    window.scrollTo(0, 0);
  }

  useEffect(() => {
    if (!readToken()) {
      setCheckingSession(false);
      return;
    }
    api("/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        localStorage.removeItem("quizhistory-token");
        sessionStorage.removeItem("quizhistory-token");
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function logout() {
    localStorage.removeItem("quizhistory-token");
    sessionStorage.removeItem("quizhistory-token");
    setUser(null);
    navigate("/");
  }

  if (checkingSession) return <div className="session-loading"><BrandMark /> Đang xác thực phiên học tập...</div>;
  if (user && (pathname === "/packages" || pathname.startsWith("/packages/"))) {
    const packageId = pathname.startsWith("/packages/") ? pathname.slice("/packages/".length) : null;
    return <PackagesPage user={user} onLogout={logout} onNavigate={navigate} packageId={packageId} />;
  }
  if (user && pathname === "/profile") {
    function updateUser(currentUser, token) {
      setUser(currentUser);
      const storage = localStorage.getItem("quizhistory-token") ? localStorage : sessionStorage;
      storage.setItem("quizhistory-token", token);
    }
    return <ProfilePage user={user} onUpdateUser={updateUser} onLogout={logout} onNavigate={navigate} />;
  }
  if (user && pathname === "/leaderboard") {
    return <LeaderboardPage user={user} onLogout={logout} onNavigate={navigate} />;
  }
  if (user && pathname !== "/") return <StudyHomePage user={user} onLogout={logout} onNavigate={navigate} />;
  if (pathname === "/login" || pathname === "/register" || pathname === "/app") {
    return <LoginPage
      initialMode={pathname === "/register" ? "register" : "login"}
      onLogin={(currentUser) => { setUser(currentUser); navigate("/app"); }}
    />;
  }
  return <HomePage
    onLogin={() => navigate("/login")}
    onSignup={() => navigate("/register")}
    onStartFree={() => navigate(user ? "/app" : "/login")}
  />;
}