import AdminClientLayout from './client-layout'

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <AdminClientLayout locale={params.locale}>
      {children}
    </AdminClientLayout>
  )
}
