"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUser } from "@/lib/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await createUser({ name, password });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-bold text-panini-gold tracking-wide">
            PANINI WC 2026
          </h1>
          <p className="text-panini-gray mt-2">Create your account</p>
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
              minLength={2}
              autoFocus
              className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-4 py-2.5 text-panini-white placeholder-panini-gray focus:outline-none focus:border-panini-gold focus:ring-1 focus:ring-panini-gold"
              placeholder="Choose a unique name"
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
              minLength={8}
              className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-4 py-2.5 text-panini-white placeholder-panini-gray focus:outline-none focus:border-panini-gold focus:ring-1 focus:ring-panini-gold"
              placeholder="Minimum 8 characters"
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
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-center text-panini-gray text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-panini-gold hover:text-panini-gold-lt transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
