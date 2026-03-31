import { useState, useCallback } from "react";
import { X, Loader2, User, Mail, Lock, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "signin" | "signup";

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail("");
    setHandle("");
    setPassword("");
    setError(null);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    reset();
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        if (tab === "signin") {
          await login(email, password);
        } else {
          if (!handle.trim()) {
            setError("Handle is required");
            setLoading(false);
            return;
          }
          await register(email, handle.trim(), password);
        }
        reset();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [tab, email, handle, password, login, register, onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-[#0acb9b]/20 shadow-2xl"
        style={{
          background: "hsl(var(--card))",
          boxShadow: "0 0 40px rgba(10,203,155,0.08), 0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0acb9b]/70 mb-0.5">
              Aliasist Pulse
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {tab === "signin" ? "Welcome back" : "Create account"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-6 mb-5 rounded-xl bg-white/5 border border-white/8 p-0.5">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                tab === t
                  ? "bg-[#0acb9b]/15 text-[#0acb9b] border border-[#0acb9b]/25"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {/* Email */}
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoComplete="email"
              className={cn(
                "w-full pl-9 pr-4 py-2.5 rounded-xl text-sm",
                "bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50",
                "outline-none transition-all",
                "focus:border-[#0acb9b]/40 focus:ring-2 focus:ring-[#0acb9b]/10",
                "focus:bg-white/8"
              )}
            />
          </div>

          {/* Handle — signup only */}
          {tab === "signup" && (
            <div className="relative">
              <AtSign
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="Handle (e.g. jsmith)"
                required
                autoComplete="username"
                maxLength={30}
                className={cn(
                  "w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-mono",
                  "bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50",
                  "outline-none transition-all",
                  "focus:border-[#0acb9b]/40 focus:ring-2 focus:ring-[#0acb9b]/10",
                  "focus:bg-white/8"
                )}
              />
            </div>
          )}

          {/* Password */}
          <div className="relative">
            <Lock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              className={cn(
                "w-full pl-9 pr-4 py-2.5 rounded-xl text-sm",
                "bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50",
                "outline-none transition-all",
                "focus:border-[#0acb9b]/40 focus:ring-2 focus:ring-[#0acb9b]/10",
                "focus:bg-white/8"
              )}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 text-xs text-rose-400">
              <X size={12} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              "bg-gradient-to-r from-[#0acb9b] to-[#06956e] text-black",
              "hover:brightness-110 hover:shadow-[0_0_16px_rgba(10,203,155,0.4)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {tab === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>
                <User size={15} />
                {tab === "signin" ? "Sign In" : "Create Account"}
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground/60 pt-1">
            {tab === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("signup")}
                  className="text-[#0acb9b] hover:underline"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("signin")}
                  className="text-[#0acb9b] hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
