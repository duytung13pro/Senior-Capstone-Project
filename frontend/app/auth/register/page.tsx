"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Student" as "Student" | "Instructor" | "Admin",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (!result.success) {
        setError(result.message || "Đăng ký thất bại");
        setIsLoading(false);
        return;
      }

      // Registration successful, redirect to dashboard based on role
      if (result.user) {
        const roleRoute = result.user.role.toLowerCase();
        localStorage.setItem("userId", result.user.id);
        localStorage.setItem("role", result.user.role);

        if (roleRoute === "instructor" || roleRoute === "teacher") {
          router.push("/dashboard/teacher");
        } else if (roleRoute === "student") {
          router.push("/dashboard/student");
        } else {
          router.push("/dashboard/admin");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
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
            <span className="text-green-800 font-bold text-lg">
              Rewood Project
            </span>
          </div>
        </Link>
        <div className="text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link
            href="/auth/login"
            className="text-green-600 font-medium hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </header>

      {/* Registration Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-green-800 mb-6 text-center">
              Đăng Ký Tài Khoản
            </h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Họ và Tên</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Vai trò</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "Student" | "Instructor" | "Admin") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Học viên</SelectItem>
                    <SelectItem value="Instructor">Giảng viên</SelectItem>
                    <SelectItem value="Admin">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ít nhất 6 ký tự"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  minLength={6}
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng ký..." : "Đăng Ký"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Bằng việc đăng ký, bạn đồng ý với{" "}
              <a href="#" className="text-green-600 hover:underline">
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="#" className="text-green-600 hover:underline">
                Chính sách bảo mật
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
