import { useState, FormEvent } from "react"
import { Link } from "wouter"
import { useHashLocation } from "wouter/use-hash-location"
import { Eye, EyeOff, TrendingUp, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { setToken } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface PasswordRule {
  label: string
  test: (pw: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Contains a number", test: (pw) => /\d/.test(pw) },
  { label: "Contains a letter", test: (pw) => /[a-zA-Z]/.test(pw) },
]

function passwordStrength(password: string): "weak" | "fair" | "strong" {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length
  if (passed === 0) return "weak"
  if (passed <= 1) return "weak"
  if (passed === 2) return "fair"
  return "strong"
}

const STRENGTH_COLORS = {
  weak: "bg-rose-500",
  fair: "bg-amber-400",
  strong: "bg-emerald-500",
}

export default function Register() {
  const [, navigate] = useHashLocation()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = password ? passwordStrength(password) : null
  const passwordsMatch = confirmPassword ? password === confirmPassword : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!agreedToTerms) {
      setError("You must agree to the terms of service to continue.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (strength === "weak") {
      setError("Please choose a stronger password.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await res.json() as any

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.")
        return
      }

      setToken(data.accessToken, data.refreshToken)
      toast({
        title: "Account created!",
        description: "Welcome to Market Pulse. Your dashboard is ready.",
      })
      navigate("/")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="theme-logo-ring flex h-14 w-14 items-center justify-center rounded-2xl">
              <TrendingUp size={28} className="text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground">
            Join Market Pulse — your personal trading console
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-2 pt-1">
                <div className="flex gap-1">
                  {(["weak", "fair", "strong"] as const).map((level, i) => (
                    <div
                      key={level}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        strength &&
                          (["weak", "fair", "strong"].indexOf(strength) >= i
                            ? STRENGTH_COLORS[strength]
                            : "bg-muted")
                      )}
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password)
                    return (
                      <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                        {passed ? (
                          <Check size={12} className="text-emerald-400 shrink-0" />
                        ) : (
                          <X size={12} className="text-muted-foreground shrink-0" />
                        )}
                        <span className={passed ? "text-emerald-400" : "text-muted-foreground"}>
                          {rule.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                className={cn(
                  "pr-10",
                  confirmPassword &&
                    (passwordsMatch
                      ? "border-emerald-500/50 focus-visible:ring-emerald-500/30"
                      : "border-rose-500/50 focus-visible:ring-rose-500/30")
                )}
              />
              {confirmPassword && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {passwordsMatch ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <X size={16} className="text-rose-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Terms of service */}
          <div className="flex items-start gap-2.5 pt-1">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(v) => setAgreedToTerms(Boolean(v))}
              disabled={loading}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              I agree to the{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !agreedToTerms || passwordsMatch === false}
          >
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login">
            <a className="text-primary hover:underline font-medium">Sign in</a>
          </Link>
        </p>
      </div>
    </div>
  )
}
