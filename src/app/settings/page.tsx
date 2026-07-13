export const dynamic = "force-dynamic";

import SettingsClient from "@/components/SettingsClient";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>

      <SettingsClient />
    </div>
  );
}
