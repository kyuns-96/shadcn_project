import DashboardSidebar from './components/DashboardSidebar'
import { ThemeProvider } from './components/theme-provider'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DashboardSidebar />
    </ThemeProvider>
  )
}
export default App
