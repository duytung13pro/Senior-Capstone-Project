import { getServerSession, type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-nextauth-secret-change-me",
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await dbConnect()
        const identifier = String(credentials.email).trim()
        const normalizedEmail = identifier.toLowerCase()

        const user = await User.findOne({
          $or: [
            { email: normalizedEmail },
            { phone: identifier },
          ],
        }).select("+password")

        if (!user) {
          return null
        }

        const storedPassword = String(user.password || "")
        const looksHashed = /^\$2[aby]\$\d{2}\$/.test(storedPassword)

        const isValidPassword = looksHashed
          ? await bcrypt.compare(credentials.password as string, storedPassword)
          : (credentials.password as string) === storedPassword

        if (!isValidPassword) {
          return null
        }

        const fallbackName = `${String((user as any).firstName || "").trim()} ${String((user as any).lastName || "").trim()}`.trim()

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || fallbackName || user.email,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.name = user.name
        token.email = user.email
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name
        token.email = session.user.email ?? token.email
        token.picture = undefined
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name
        session.user.email = token.email
      }
      return session
    },
  },
}

export async function auth() {
  return getServerSession(authOptions)
}
