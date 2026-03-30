import Sidebar from "../components/Sidebar";

export default function SettingsPage() {
  return (
    <div className="dashboard-grid app-shell">
      <Sidebar eli5Mode={false} onToggleEli5={() => {}} />
      <div className="main-content flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-xl w-full p-8 mt-16 bg-background rounded-2xl shadow-lg border border-border text-center">
          <h1 className="theme-title text-2xl mb-2">Aliasist Pulse</h1>
          <p className="text-muted-foreground mb-4">
            This application is private and for personal use only.<br />
            Data is provided for informational purposes.<br />
            <strong>Created by Aliasist developer Blake Hooper.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
