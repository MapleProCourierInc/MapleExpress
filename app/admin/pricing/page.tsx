import { AdminPricingManager } from "@/components/admin/admin-pricing-manager"
import { getAdminPricingModels } from "@/lib/admin-pricing-service"

export default async function AdminPricingPage() {
  const { data, error } = await getAdminPricingModels()

  return <AdminPricingManager initialData={data} initialError={error} />
}
