import { AdminPlatformConfigurationManager } from "@/components/admin/admin-platform-configuration-manager"
import { getAdminFaqs, getAdminPlatformConfiguration, getAdminWorkingHours } from "@/lib/admin-platform-configuration-service"

export default async function AdminPlatformConfigurationPage() {
  const [configurationResult, faqResult, workingHoursResult] = await Promise.all([
    getAdminPlatformConfiguration(),
    getAdminFaqs(),
    getAdminWorkingHours(),
  ])

  return (
    <AdminPlatformConfigurationManager
      initialData={configurationResult.data}
      initialError={configurationResult.error}
      initialFaqs={faqResult.data}
      initialFaqError={faqResult.error}
      initialWorkingHours={workingHoursResult.data || configurationResult.data?.workingHours || null}
      initialWorkingHoursError={workingHoursResult.data || configurationResult.data?.workingHours ? null : workingHoursResult.error}
    />
  )
}
