import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Store Settings</h1>
      <SettingsForm
        initial={{
          storeName: settings.storeName,
          tagline: settings.tagline,
          whatsappNumber: settings.whatsappNumber,
          storePhone: settings.storePhone ?? "",
          storeEmail: settings.storeEmail ?? "",
          storeAddress: settings.storeAddress ?? "",
          deliveryFee: settings.deliveryFee / 100,
          freeDeliveryAbove: settings.freeDeliveryAbove ? settings.freeDeliveryAbove / 100 : undefined,
          codEnabled: settings.codEnabled,
          codAdvancePercent: settings.codAdvancePercent,
          instagramUrl: settings.instagramUrl ?? "",
          facebookUrl: settings.facebookUrl ?? "",
        }}
      />
    </div>
  );
}
