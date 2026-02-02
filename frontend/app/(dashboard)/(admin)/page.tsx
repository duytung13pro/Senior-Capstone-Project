// Admin Dashboard - Future Implementation
export default function AdminDashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Admin Portal</h1>
        <p className="text-muted-foreground mb-4">This section is reserved for admin features</p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-sm">
          <li>• Manage all users (Students, Teachers, Center Admins)</li>
          <li>• System-wide analytics and reporting</li>
          <li>• Configuration and settings</li>
          <li>• Account management and billing</li>
        </ul>
      </div>
    </div>
  )
}
