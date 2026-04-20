import React, { useState } from 'react';
import type { TabType } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Tasks from './components/Tasks';
import Reminders from './components/Reminders';
import Wellbeing from './components/Wellbeing';
import Settings from './components/Settings';
import StarField from './components/StarField';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  function renderTab() {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'schedule': return <Schedule />;
      case 'tasks': return <Tasks />;
      case 'reminders': return <Reminders />;
      case 'wellbeing': return <Wellbeing />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  }

  return (
    <div className="app">
      <StarField />
      <header className="app-header">
        <h1 className="app-title">✨ Teacher Diary</h1>
      </header>
      <main className="app-main">
        <div key={activeTab} className="tab-content">
          {renderTab()}
        </div>
      </main>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;
