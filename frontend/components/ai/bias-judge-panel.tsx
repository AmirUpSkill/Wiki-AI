"use client"

import React, { useState } from "react"
import { ShieldAlert, AlertCircle, ChevronDown, ChevronUp, RefreshCw, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAppStore } from "@/store/app-store"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

interface BiasJudgePanelProps {
    content: string
}

export function BiasJudgePanel({ content }: BiasJudgePanelProps) {
    const {
        biasJudgeResult,
        isBiasJudgeLoading,
        biasJudgeError,
        analyzeBias,
    } = useAppStore()

    const [isExpanded, setIsExpanded] = useState(false)

    const handleAnalyze = () => {
        analyzeBias(content)
    }

    const getScoreColor = (score: number) => {
        if (score <= 30) return "text-green-500 bg-green-500/10"
        if (score <= 60) return "text-amber-500 bg-amber-500/10"
        return "text-red-500 bg-red-500/10"
    }

    const getScoreBorder = (score: number) => {
        if (score <= 30) return "border-green-500/20"
        if (score <= 60) return "border-amber-500/20"
        return "border-red-500/20"
    }

    return (
        <Card className={cn(
            "overflow-hidden transition-all duration-300 border-border/50",
            biasJudgeResult ? getScoreBorder(biasJudgeResult.bias_score) : "border-dashed"
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <ShieldAlert className={cn(
                        "h-5 w-5",
                        biasJudgeResult ? (biasJudgeResult.bias_score <= 30 ? "text-green-500" : biasJudgeResult.bias_score <= 60 ? "text-amber-500" : "text-red-500") : "text-muted-foreground"
                    )} />
                    <div>
                        <CardTitle className="text-lg font-bold">AI Bias Judge</CardTitle>
                        <CardDescription>Analyze content for neutrality and perspective</CardDescription>
                    </div>
                </div>
                {!biasJudgeResult && !isBiasJudgeLoading && (
                    <Button
                        onClick={handleAnalyze}
                        variant="outline"
                        size="sm"
                        className="rounded-full border-accent/20 hover:bg-accent/5 hover:text-accent"
                    >
                        Analyze for Bias
                    </Button>
                )}
                {biasJudgeResult && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 w-8 text-muted-foreground"
                    >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {isBiasJudgeLoading && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-3">
                        <RefreshCw className="h-8 w-8 text-accent animate-spin" />
                        <p className="text-sm text-muted-foreground animate-pulse">Our AI Judge is reviewing the content...</p>
                    </div>
                )}

                {biasJudgeError && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Analysis Failed</p>
                            <p className="text-xs opacity-80">{biasJudgeError}</p>
                            <Button
                                onClick={handleAnalyze}
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-7 px-2 text-destructive hover:bg-destructive/10"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}

                {biasJudgeResult && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bias Score</span>
                                <div className="flex items-end gap-1">
                                    <span className={cn(
                                        "text-4xl font-black leading-none",
                                        biasJudgeResult.bias_score <= 30 ? "text-green-500" : biasJudgeResult.bias_score <= 60 ? "text-amber-500" : "text-red-500"
                                    )}>
                                        {biasJudgeResult.bias_score}
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground mb-1">/100</span>
                                </div>
                            </div>

                            <div className="flex-1 max-w-[200px] h-2 bg-secondary/50 rounded-full overflow-hidden mx-6">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        biasJudgeResult.bias_score <= 30 ? "bg-green-500" : biasJudgeResult.bias_score <= 60 ? "bg-amber-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${biasJudgeResult.bias_score}%` }}
                                />
                            </div>

                            <div className={cn(
                                "px-4 py-2 rounded-2xl text-sm font-bold border",
                                getScoreColor(biasJudgeResult.bias_score),
                                getScoreBorder(biasJudgeResult.bias_score)
                            )}>
                                {biasJudgeResult.bias_score <= 30 ? "Highly Neutral" : biasJudgeResult.bias_score <= 60 ? "Mild Bias" : "Significant Bias"}
                            </div>
                        </div>

                        {(isExpanded || !biasJudgeResult.explanation) && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="text-sm font-semibold">Judge's Explanation</h4>
                                </div>
                                <div className="p-4 bg-secondary/10 border border-border/30 rounded-2xl prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-foreground/80 prose-strong:text-primary prose-em:text-foreground/90">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                    >
                                        {biasJudgeResult.explanation}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {!isExpanded && (
                            <div
                                className="text-xs text-center text-muted-foreground cursor-pointer hover:text-accent transition-colors"
                                onClick={() => setIsExpanded(true)}
                            >
                                Click to view detailed explanation
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
