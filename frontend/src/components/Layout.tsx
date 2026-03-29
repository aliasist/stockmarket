import React from 'react';
import AliasistBrand from './AliasistBrand';
import Footer from './Footer';
import { Link } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b">
        <AliasistBrand />
        <nav className="flex gap-4 text-sm">
          <Link to="/">Dashboard</Link>
          <Link to="/ask">Ask AI</Link>
          <Link to="/research">Research</Link>
          <Link to="/image">Image Studio</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>
      <main className="flex-1 p-4">{children}</main>
      <Footer />
    </div>
  );
}
