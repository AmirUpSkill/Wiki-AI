import { z } from "zod";

// --- Preview Card ---
export const cardSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
})
// ---  Full Card Schema --- 
export const fullCardSchema = cardSchema.extend({
    content: z.string().max(200000, "Content is too long").optional().nullable(),
});


export const cardsResponseSchema = z.array(cardSchema);

// --- Add Card --- 
export const createCardSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .max(200, "Title must be 200 characters or less"),
    system_prompt: z
        .string()
        .min(10 , "System prompt must be at least 10 Characters")
        .max(2000, "System prompt must be 2000 characters or less"),
    topics_to_cover: z
        .string()
        .min(1, "Topic to Cover are required ")
        .max(1000, "Topic must be 1000 characers or less"),
    context_file: z
        .instanceof(File, { message: "Please select a valid PDF file" })
        .refine((file) => file.type === "application/pdf", {
            message: "Only PDF files are supported",
        })
        .refine((file) => file.size <= 5 * 1024 * 1024, {
            message: "File size must be less than 5MB",
        })
        .optional()
        .nullable(),
});
// --- AI Copilot Schemas --- 
export const copilotRequestSchema = z.object({
    question: z.string().min(1, "Question cannot be empty."),
    context: z.string().min(1,"Context cannot be empty")
})
export const copilotResponseSchema = z.object({
    answer: z.string(),
})
// --- Get Type for Card Preview --- 
export type Card = z.infer<typeof cardSchema>;
// ---- Infer Type for Card Creation  ---
export type CreateCardFormData  = z.infer<typeof createCardSchema>;
// --- Infer Type for Full Card ---
export type FullCard = z.infer<typeof fullCardSchema>;
// --- AI Copilot Types --- 
export type CopilotRequest = z.infer<typeof copilotRequestSchema>
export type CopilotResponse = z.infer<typeof copilotResponseSchema>