import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from '../components/Sidebar';

export function MainLayout() {
  const location = useLocation();
  const isSurveyDetail = /^\/core-3\/qc\/billboard-survey\/[^/]+/.test(location.pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isSurveyDetail);

  useEffect(() => {
    setIsSidebarCollapsed(isSurveyDetail);
  }, [isSurveyDetail]);

  return (
    <div style={{ 
      backgroundColor: 'var(--color-secondary)',
      minHeight: '100vh',
      display: 'flex',
    }}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <main style={{
        marginLeft: isSidebarCollapsed ? '80px' : '240px',
        flex: 1,
        padding: '32px',
        transition: 'margin-left 0.3s ease',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
