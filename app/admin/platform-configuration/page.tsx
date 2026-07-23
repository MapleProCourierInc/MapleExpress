import { AdminPlatformConfigurationManager } from "@/components/admin/admin-platform-configuration-manager"
import { getAdminPlatformConfiguration } from "@/lib/admin-platform-configuration-service"

export default async function AdminPlatformConfigurationPage() {
  const { data, error } = await getAdminPlatformConfiguration()
  return <AdminPlatformConfigurationManager initialData={data} initialError={error} />
}
