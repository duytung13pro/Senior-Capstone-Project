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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await dbConnect()
        const user = await User.findOne({ email: credentials.email }).select("+password")

        if (!user) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password,
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
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
