"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Event handler for clicking the "Dang Ky" button
  // Will send a POST request to localhost:8080/api/register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    await fetch("http://localhost:8080/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });
  
    alert("Đăng ký thành công!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 border p-6 rounded-lg"
      >
        <h1 className="text-2xl font-bold text-center">Đăng ký</h1>

        <Input
          placeholder="Họ và tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button className="w-full bg-green-600 hover:bg-green-700">
          Đăng ký
        </Button>
      </form>
    </div>
  );
}
