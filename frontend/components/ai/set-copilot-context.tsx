"use client"

import { useEffect } from "react"
import { useAppStore } from "@/store/app-store"

interface SetCopilotContextProps {
  context: string
}

export function SetCopilotContext({ context }: SetCopilotContextProps) {
  const { setCopilotContext } = useAppStore()

  useEffect(() => {
    // ----  Set the context in the global store ----
    setCopilotContext(context)
  }, [context, setCopilotContext])

  return null
}