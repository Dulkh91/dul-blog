import { useEffect, useState, type ReactNode } from "react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@components/components/ui/sidebar"
import { AppSidebar } from "@components/app-sidebar"
import { Search, X } from "lucide-react"
import type { UserProp } from "@components/types/userType"
import { isAddTransaction } from "../stores/store"


export function DashboardShell({
  children,
  userName,
  userRole,
  currentPath,
  searchQuery: initialSearch = "",
  currentCategory = "",
  currentTag = "",
  currentStatus = "",
}: {
  children: ReactNode
  userName: UserProp
  userRole: string
  currentPath?: string
  searchQuery?: string
  currentCategory?: string
  currentTag?: string
  currentStatus?: string
}) {
  const [searchValue, setSearchValue] = useState(initialSearch)
  const [path, setPath] = useState(currentPath ?? "")

  useEffect(() => {
    setSearchValue(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    if (currentPath) setPath(currentPath)
    if (typeof window !== "undefined") {
      setPath(window.location.pathname)
      const handleLocationChange = () => setPath(window.location.pathname)
      window.addEventListener("popstate", handleLocationChange)
      document.addEventListener("astro:page-load", handleLocationChange)
      return () => {
        window.removeEventListener("popstate", handleLocationChange)
        document.removeEventListener("astro:page-load", handleLocationChange)
      }
    }
  }, [currentPath])

  const isTransactionsPage = path?.replace(/\/+$/, "") === "/expand/dashboard/transactions"

  const handleClear = () => {
    setSearchValue("")
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("q")
      window.location.href = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "")
    }
  }

  const handleButtonAddTransaction = () => {
    isAddTransaction?.set?.(true)
  }

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} userRole={userRole} currentPath={currentPath} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className={" md:hidden"}/>
          <span className="text-sm font-medium hidden sm:inline">Dashboard {currentPath?.startsWith("/expand") && "Expand"}</span>
          {!isTransactionsPage &&(
            <form
            method="GET"
            action="/dashboard"
            role="search"
            className="relative mx-auto flex w-full max-w-xs sm:max-w-md items-center"
          >
            {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
            {currentTag && <input type="hidden" name="tag" value={currentTag} />}
            {currentStatus && <input type="hidden" name="status" value={currentStatus} />}

            {/* Search at Dashboard */}
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              name="q"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="ស្វែងរក..."
              className="w-full rounded-xl border border-input bg-background py-1.5 pl-9 pr-8 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
          )}
          
          {/* Button Add transaction - បង្ហាញតែពេលស្ថិតនៅលើ /expand/dashboard/transactions */}
          {isTransactionsPage && (
            <div className=" ml-auto">
              <button
                type="button"
                onClick={handleButtonAddTransaction}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
              >
                + transaction
              </button>
            </div>
          )}
        </header>
        <main className="flex-1 p-1.5 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
