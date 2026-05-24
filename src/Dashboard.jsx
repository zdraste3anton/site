import React from 'react';
import ParticleBackground from './components/ParticleBackground';
import DashboardHeader from './components/DashboardHeader';
import PageShell from './components/PageShell';
import DashboardHeroSection from './components/dashboard/DashboardHeroSection';
import DashboardQuickActions from './components/dashboard/DashboardQuickActions';
import DashboardSystemFeatures from './components/dashboard/DashboardSystemFeatures';
import DashboardHowItWorks from './components/dashboard/DashboardHowItWorks';
import DashboardDiceWidget from './components/dashboard/DashboardDiceWidget';
import DashboardWhySection from './components/dashboard/DashboardWhySection';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  return (
    <PageShell variant="main">
      <ParticleBackground variant="viewport" />
      <DashboardHeader />
      <main className={styles.main}>
        <div className={styles.stack}>
          <DashboardHeroSection />
          <DashboardQuickActions />
          <DashboardSystemFeatures />
          <DashboardHowItWorks />
          <div className={styles.dock}>
            <DashboardDiceWidget />
            <DashboardWhySection />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
