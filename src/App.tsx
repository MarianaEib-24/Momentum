import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider, useStore } from './lib/store';
import Shell from './components/Shell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Goals from './pages/Goals';
import Habits from './pages/Habits';
import Calendar from './pages/Calendar';
import Journal from './pages/Journal';
import Brainstorm from './pages/Brainstorm';
import Future from './pages/Future';
import Resources from './pages/Resources';
import Stats from './pages/Stats';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function RequireAuth() {
  const { me } = useStore();
  if (!me) return <Navigate to="/login" replace />;
  return <Shell />;
}

function HomeRedirect() {
  const { me } = useStore();
  return <Navigate to={me ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/brainstorm" element={<Brainstorm />} />
            <Route path="/future" element={<Future />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
