"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`http://localhost:8080/register`, {
        name: name,
        email: email,
        password: password,
      });
      alert("Registration successful! Please login.");
      router.push("/login");
    } catch (err) {
      alert("Registration failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-zinc-900 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-white">Register</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-500 focus:border-blue-500 transition"
            required
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-500 focus:border-blue-500 transition"
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-500 focus:border-blue-500 transition"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-zinc-400 text-sm text-center">
        Already have an account?{" "}
        <a href="/login" className="text-blue-400 hover:underline">
          Login here
        </a>
      </p>
    </div>
  );
}
