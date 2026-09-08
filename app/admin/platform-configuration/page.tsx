import { AdminPlatformConfigurationManager } from "@/components/admin/admin-platform-configuration-manager"
import { getAdminFaqs, getAdminPlatformConfiguration } from "@/lib/admin-platform-configuration-service"

export default async function AdminPlatformConfigurationPage() {
  const [configurationResult, faqResult] = await Promise.all([
    getAdminPlatformConfiguration(),
    getAdminFaqs(),
  ])

  return (
    <AdminPlatformConfigurationManager
      initialData={configurationResult.data}
      initialError={configurationResult.error}
      initialFaqs={faqResult.data}
      initialFaqError={faqResult.error}
    />
  )
}
