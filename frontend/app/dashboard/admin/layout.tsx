import React from "react"
// Admin Portal Layout
// TODO: Implement admin dashboard with role-based access control

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Admin Portal - Coming Soon
        </p>
      </div>
      {children}
    </div>
  )
}
