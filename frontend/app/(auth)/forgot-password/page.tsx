'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter your email to reset your password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
        <Button className="w-full">Send Reset Link</Button>
        <div className="text-sm text-center">
          <p>
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
