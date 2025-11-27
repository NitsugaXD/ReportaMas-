import PageTransition from './PageTransition'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition>
      {children}
    </PageTransition>
  )
}