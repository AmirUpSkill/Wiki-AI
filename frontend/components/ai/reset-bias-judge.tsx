"use client"

import { useEffect } from "react"
import { useAppStore } from "@/store/app-store"

export function ResetBiasJudge() {
    const { resetBiasJudge } = useAppStore()

    useEffect(() => {
        // Reset the bias judge state when this component mounts/unmounts
        return () => {
            resetBiasJudge()
        }
    }, [resetBiasJudge])

    return null
}
