import ResearchChatPanel from "../components/ResearchChatPanel";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

export default function ResearchPage() {
  const [eli5Mode, setEli5Mode] = useState(false);
  return (
    <div className="dashboard-grid app-shell">
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode(!eli5Mode)} />
      <div className="main-content flex flex-col min-h-0">
        <header className="theme-topbar shrink-0 px-6 py-5 border-b border-border">
          <div className="theme-kicker mb-1">Groq</div>
          <h1 className="theme-title text-2xl text-foreground">Research chat</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Same stack as the dashboard — chat uses the server so your API key is not baked into the client bundle.
          </p>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 flex justify-center items-start">
          <ResearchChatPanel />
        </div>
      </div>
    </div>
  );
}
