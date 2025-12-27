"use client"

import { useEffect, useState } from "react"
import { Search, Plus } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { cn } from "@/lib/utils"

interface SearchPanelProps {
  onSearch: (query?: string) => void
}

export function SearchPanel({ onSearch }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const { openAddCardDialog } = useAppStore()

  useEffect(() => {
    const timer = setTimeout(() => onSearch(searchTerm || undefined), 300)
    return () => clearTimeout(timer)
  }, [searchTerm, onSearch])

  return (
    <div className={cn(
      "w-full rounded-full bg-background/60 backdrop-blur-xl border border-border/40 px-2 py-2 mb-12 sticky top-6 z-30 transition-all duration-500",
      isFocused ? "shadow-lg ring-1 ring-primary/10 bg-background/80" : "shadow-sm hover:shadow-md",
    )}>
      <div className="flex items-center gap-2 relative h-12">
        <div className="pl-4 flex items-center justify-center">
          <Search className={cn(
            "h-5 w-5 transition-colors duration-300",
            isFocused ? "text-primary" : "text-muted-foreground/50"
          )} />
        </div>
        <input
          type="text"
          placeholder="Search history cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 h-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground/40 focus:outline-none text-[0.95rem] font-medium"
          aria-label="Search cards"
        />
        <button
          onClick={openAddCardDialog}
          className="flex items-center justify-center gap-2 px-6 h-full rounded-full bg-accent hover:bg-accent/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 whitespace-nowrap"
        >
          <Plus className="h-5 w-5" />
          <span>Add Card</span>
        </button>
      </div>
    </div>
  )
}