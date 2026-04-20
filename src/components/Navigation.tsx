import React from 'react';
import type { TabType } from '../types';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; emoji: string }[] = [
  { id: 'dashboard', label: 'Home', emoji: '🏠' },
  { id: 'schedule', label: 'Schedule', emoji: '📅' },
  { id: 'tasks', label: 'Tasks', emoji: '✅' },
  { id: 'reminders', label: 'Reminders', emoji: '🔔' },
  { id: 'ocd', label: 'OCD', emoji: '🧘' },
  { id: 'adhd', label: 'ADHD', emoji: '⚡' },
  { id: 'settings', label: 'Settings', emoji: '⚙️' },
];

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? 'nav-tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          <span className="nav-tab__emoji">{tab.emoji}</span>
          <span className="nav-tab__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
