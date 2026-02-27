export const dynamic = "force-dynamic";

import { getCurrentUserProfileSettings } from "@/app/actions/profile";
import { ProfileSettingsPage } from "@/components/profile-settings-page";

export default async function StudentProfilePage() {
  const profile = await getCurrentUserProfileSettings();

  return <ProfileSettingsPage initialData={profile} />;
}
