import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { BlogCardContent } from "@/components/cards/blog-card-content"
import { CopilotPopup } from "@/components/ai/copilot-popup"
import { fetchCardById } from "@/lib/api"
import { SetCopilotContext } from "@/components/ai/set-copilot-context"
import { BiasJudgePanel } from "@/components/ai/bias-judge-panel"
import { ResetBiasJudge } from "@/components/ai/reset-bias-judge"

export default async function CardPage({ params }: { params: { id: string } }) {
  const { id } = params
  let card

  try {
    card = await fetchCardById(id)
  } catch (error: any) {
    if ((error.message || "").toLowerCase().includes("not found")) notFound()
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-primary mb-4">Oops! Something went wrong</h1>
        <p className="text-foreground/70">Failed to load this card. Please try again.</p>
      </div>
    )
  }

  // Combine title, description, and content for the copilot context.
  const copilotContext = `Title: ${card.title}\n\nDescription: ${card.description}\n\nContent: ${card.content || ""}`

  return (
    <>
      <article className="container max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-5xl font-bold text-primary mb-4 leading-tight">{card.title}</h1>
          {card.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {card.keywords.map((keyword, i) => (
                <Badge key={i} variant="secondary" className="bg-secondary/50 text-primary hover:bg-secondary/70 transition-colors text-sm px-3 py-1">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <div className="h-px bg-border mb-12" />
        <BlogCardContent content={card.description} />

        <div className="mt-16 pt-8 border-t border-border/50">
          <BiasJudgePanel content={card.description} />
        </div>
      </article>

      {/* Set the copilot context for the current page */}
      <SetCopilotContext context={copilotContext} />

      {/* Reset Bias Judge state on navigation */}
      <ResetBiasJudge />

      {/* Render the Copilot FAB and Popup */}
      <CopilotPopup />
    </>
  )
}