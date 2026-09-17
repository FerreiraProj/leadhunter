import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { BottomNav } from "./components/layout/BottomNav";
import { LoginView } from "./components/auth/LoginView";
import { DashboardView } from "./components/dashboard/DashboardView";
import { LeadsListView } from "./components/leads/LeadsListView";
import { LeadDetailView } from "./components/leads/LeadDetailView";
import { ImportView } from "./components/import/ImportView";
import { MapView } from "./components/map/MapView";
import { VisitsView } from "./components/visits/VisitsView";
import { RemindersView } from "./components/reminders/RemindersView";
import { SettingsView } from "./components/settings/SettingsView";
import { AIPitchModal } from "./components/ai/AIPitchModal";
import { WinDealModal } from "./components/leads/WinDealModal";
import { ToastContainer } from "./components/common/Toast";

const AppContent: React.FC = () => {
  const { session, activeView, toasts, removeToast, winDealModalLead, closeWinDealModal } = useApp();

  if (!session.isLoggedIn) {
    return (
      <div className="relative min-h-screen bg-[#020408] text-slate-300 overflow-hidden font-sans selection:bg-cyan-400 selection:text-black">
        {/* Ambient background glows */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1a2b4d] rounded-full blur-[140px] opacity-40 pointer-events-none z-0" />
        <div className="fixed bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-[#2a134d] rounded-full blur-[120px] opacity-35 pointer-events-none z-0" />

        <div className="relative z-10">
          <LoginView />
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020408] flex flex-col lg:flex-row text-slate-300 font-sans selection:bg-cyan-400 selection:text-black relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#1a2b4d] rounded-full blur-[140px] opacity-35 pointer-events-none z-0" />
      <div className="fixed bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-[#2a134d] rounded-full blur-[120px] opacity-30 pointer-events-none z-0" />
      <div className="fixed top-[45%] left-[30%] w-[30%] h-[30%] bg-[#083344] rounded-full blur-[130px] opacity-20 pointer-events-none z-0" />

      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 relative z-10">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === "dashboard" && <DashboardView />}
          {activeView === "leads" && <LeadsListView />}
          {activeView === "lead_detail" && <LeadDetailView />}
          {activeView === "import" && <ImportView />}
          {activeView === "map" && <MapView />}
          {activeView === "visits" && <VisitsView />}
          {activeView === "reminders" && <RemindersView />}
          {activeView === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals & Toasts */}
      <AIPitchModal />
      <WinDealModal
        isOpen={!!winDealModalLead}
        lead={winDealModalLead}
        onClose={closeWinDealModal}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
