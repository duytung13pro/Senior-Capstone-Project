import React from "react"
// Center/Franchise Portal Layout
// TODO: Implement center-level analytics and management

export default function CenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Center/Franchise Portal - Coming Soon
        </p>
      </div>
      {children}
    </div>
  )
}
