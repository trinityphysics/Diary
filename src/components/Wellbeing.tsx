import React, { useState } from 'react';
import OCDTools from './OCDTools';
import ADHDTools from './ADHDTools';
import SleepTools from './SleepTools';

type WSection = 'ocd' | 'adhd' | 'sleep';

const Wellbeing: React.FC = () => {
  const [section, setSection] = useState<WSection>('ocd');

  return (
    <div className="wellbeing">
      <div className="section-tabs wellbeing-tabs">
        <button
          className={`section-tab ${section === 'ocd' ? 'section-tab--active' : ''}`}
          onClick={() => setSection('ocd')}
        >
          🧘 OCD
        </button>
        <button
          className={`section-tab ${section === 'adhd' ? 'section-tab--active' : ''}`}
          onClick={() => setSection('adhd')}
        >
          ⚡ ADHD
        </button>
        <button
          className={`section-tab ${section === 'sleep' ? 'section-tab--active' : ''}`}
          onClick={() => setSection('sleep')}
        >
          🌙 Sleep
        </button>
      </div>
      {section === 'ocd' && <OCDTools />}
      {section === 'adhd' && <ADHDTools />}
      {section === 'sleep' && <SleepTools />}
    </div>
  );
};

export default Wellbeing;
