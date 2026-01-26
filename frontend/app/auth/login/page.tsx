// app/login/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle User request when trying to login.
  // Request will be sent to localhosts:8080/api/login at localhosts:8080
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      const res = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });
      const data = await res.json();

      // Handle non-2xx responses
      if (!res.ok) {
        throw new Error(errorData.message || "Login failed");
      }
  
      // If backend returns user / token info
      console.log("Login success:", data);
      
      // save role so layouts can read it
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.id);
      
      // Redirect after successful login
      if (data.role === "TEACHER") {
        router.push("/tutor-fe");
      } else if (data.role === "STUDENT") {
        router.push("/student-fe");
      } else {
        throw new Error("Unknown role");
      }
    } catch (error) {
      console.error("Login failed:", error);
  
      // show error to user
      alert(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-[#FFF8E9] flex flex-col">
      {/* Header */}
      <header className="container mx-auto py-4 px-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <Image
              src="/logo02.svg"
              alt="Project Rewood"
              width={100}
              height={100}
              className="w-20 h-20"
            />
            <span className="text-green-800 font-bold text-lg">Rewood Project</span>
          </div>
        </Link>
        <div className="text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-green-600 font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Đăng nhập</h1>
              <p className="text-gray-600">Chào mừng trở lại! Vui lòng nhập thông tin của bạn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email hoặc số điện thoại
                  </label>
                  <Input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email hoặc số điện thoại"
                    className="w-full bg-gray-50"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Mật khẩu
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-green-600 hover:underline"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full bg-gray-50"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang đăng nhập...
                  </div>
                ) : (
                  "Đăng nhập"
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-gray-300 hover:bg-gray-50"
                  onClick={() => console.log("Login with Google")}
                >
                  <Image
                    src="/google-icon.svg"
                    alt="Google"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-gray-300 hover:bg-gray-50"
                  onClick={() => console.log("Login with Facebook")}
                >
                  <Image
                    src="/icon-facebook.svg"
                    alt="Facebook"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Facebook
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-gray-600">
              Bằng việc đăng nhập, bạn đồng ý với{" "}
              <Link href="/terms" className="text-green-600 hover:underline">
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link href="/privacy" className="text-green-600 hover:underline">
                Chính sách bảo mật
              </Link>{" "}
              của chúng tôi
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 hover:underline"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 mt-8 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-xs text-gray-500">
              Copyright © 2025 Project Rewood. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="https://www.facebook.com/" className="text-gray-600 hover:text-blue-600">
              <Image
                src="/icon-facebook.svg"
                alt="Facebook"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </Link>
            <Link href="https://www.instagram.com/" className="text-gray-600 hover:text-pink-600">
              <Image
                src="/icon-instagram.svg"
                alt="Instagram"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </Link>
            <Link href="https://github.com/" className="text-gray-600 hover:text-gray-800">
              <Image
                src="/icon-github.svg"
                alt="GitHub"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}