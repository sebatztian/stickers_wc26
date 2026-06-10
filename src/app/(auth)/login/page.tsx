"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      name,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid name or password");
    } else {
      router.push("/collection");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/e/e5/2026_FIFA_World_Cup_emblem_%28without_trophy%29.svg"
            alt="2026 FIFA World Cup emblem"
            className="mx-auto mb-4 h-32 w-auto"
          />
          <h1 className="font-display text-5xl font-bold text-panini-gold tracking-wide">
            PANINI WC 2026
          </h1>
          <p className="text-panini-gray mt-2">Sign in to your collection</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-panini-blue/20 border border-panini-blue/40 rounded-xl p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-panini-white/80 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-4 py-2.5 text-panini-white placeholder-panini-gray focus:outline-none focus:border-panini-gold focus:ring-1 focus:ring-panini-gold"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-panini-white/80 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-4 py-2.5 text-panini-white placeholder-panini-gray focus:outline-none focus:border-panini-gold focus:ring-1 focus:ring-panini-gold"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-panini-red text-sm bg-panini-red/10 border border-panini-red/30 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-panini-gold hover:bg-panini-gold-lt text-panini-navy font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className="text-center text-panini-gray text-sm">
            No account?{" "}
            <Link href="/register" className="text-panini-gold hover:text-panini-gold-lt transition-colors">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
