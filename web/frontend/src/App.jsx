import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import NewTask from './pages/NewTask';
import TaskDetail from './pages/TaskDetail';
import SkillsView from './pages/SkillsView';
import V0View from './pages/V0View';
import ModelsView from './pages/ModelsView';
import SystemView from './pages/SystemView';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:name" element={<ProjectView />} />
          <Route path="/project/:name/tasks/new" element={<NewTask />} />
          <Route path="/project/:name/tasks/:filename" element={<TaskDetail />} />
          <Route path="/project/:name/skills" element={<SkillsView />} />
          <Route path="/v0" element={<V0View />} />
          <Route path="/models" element={<ModelsView />} />
          <Route path="/system" element={<SystemView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
