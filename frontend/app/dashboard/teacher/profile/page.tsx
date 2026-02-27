import { DashboardLayout } from "@/components/dashboard-layout";
import { ProfileSettingsPage } from "@/components/profile-settings-page";
import { getCurrentUserProfileSettings } from "@/app/actions/profile";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const profile = await getCurrentUserProfileSettings();

  return (
    <DashboardLayout>
      <ProfileSettingsPage initialData={profile} />
    </DashboardLayout>
  );
}
