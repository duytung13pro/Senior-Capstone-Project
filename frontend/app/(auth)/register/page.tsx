"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");


  // Event handler for clicking the "Dang Ky" button
  // Will send a POST request to localhost:8080/api/register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Sending the request
    try {
      const res = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          password,
          role,
        }),
        
      });
  
      const contentType = res.headers.get("content-type");
      
      // Check if the response is 2xx
      if (!res.ok) {
        if (contentType?.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.message || "Registration failed");
        }
        throw new Error("Unexpected server response");
      }
      // Successful registration
      alert("Đăng ký thành công!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Registration failed");
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 border p-6 rounded-lg"
      >
        <h1 className="text-2xl font-bold text-center">Đăng ký</h1>

        <Input
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          />
        <Input
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      
        <Input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
        {/* ROLE SELECTION */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Đăng ký với vai trò</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="STUDENT"
                checked={role === "STUDENT"}
                onChange={() => setRole("STUDENT")}
              />
              Sinh viên
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="TEACHER"
                checked={role === "TEACHER"}
                onChange={() => setRole("TEACHER")}
              />
              Giáo viên
            </label>
          </div>
        </div>


        <Button className="w-full bg-green-600 hover:bg-green-700">
          Đăng ký
        </Button>
      </form>
    </div>
  );
}
