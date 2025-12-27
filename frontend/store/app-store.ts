import { create } from "zustand";
import { fetchCards, createCard, askCopilot, analyzeForBias } from "@/lib/api";
import type { Card, CreateCardFormData, BiasJudgeResponse } from "@/lib/validators";


// --- The Strucutre Of Chat for Copilot ---
interface CopilotMessage {
    role: "user" | "ai";
    content: string;
}

interface AppState {
    // --- For Card Fetching ---
    cards: Card[];
    isLoading: boolean;
    error: string | null;
    fetchCards: (title?: string) => Promise<void>;
    // --- For Add Card --- 
    isAddCardDialogOpen: boolean
    isCreatingCard: boolean
    createCardError: string | null
    // --- AI Copilot --- 
    isCopilotOpen: boolean;
    copilotContext: string;
    copilotMessages: CopilotMessage[];
    isCopilotLoading: boolean;
    copilotError: string | null;
    // --- AI Bias Judge ---
    biasJudgeResult: BiasJudgeResponse | null;
    isBiasJudgeLoading: boolean;
    biasJudgeError: string | null;
    // --- Action for dialog management --- 
    openAddCardDialog: () => void
    closeAddCardDialog: () => void
    // --- Action for creating a card --- 
    createNewCard: (formData: CreateCardFormData) => Promise<boolean>;
    // --- Action for resetting the state after card creation ---
    resetCreateCardState: () => void;
    // --- Copilot Actions ---
    toggleCopilot: () => void;
    setCopilotContext: (context: string) => void;
    sendCopilotMessage: (question: string) => Promise<void>;
    clearCopilotChat: () => void;
    // --- Bias Judge Actions ---
    analyzeBias: (content: string) => Promise<void>;
    resetBiasJudge: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    cards: [],
    isLoading: false,
    error: null,
    // --- Fetch Cards ---
    fetchCards: async (title) => {
        set({ isLoading: true, error: null });
        try {
            const cards = await fetchCards(title);
            set({ cards, isLoading: false });
        } catch (error) {
            set({ error: "Failed to fetch cards.", isLoading: false });
        }
    },
    // --- Card Dialog State --- 
    isAddCardDialogOpen: false,
    isCreatingCard: false,
    createCardError: null,

    // --- Here List of Dialog Actions --- 
    // --- Open the "Add Card" dialog --- 
    openAddCardDialog: () => {
        set({
            isAddCardDialogOpen: true,
            createCardError: null,
        });
    },
    // --- Closes the "Add Card" dialog and reset --- 
    closeAddCardDialog: () => {
        set({
            isAddCardDialogOpen: false,
            createCardError: null,
            isCreatingCard: false,
        });
    },
    // --- Resets the creation Error --- 
    resetCreateCardState: () => {
        set({
            createCardError: null,
            isCreatingCard: false,
        });
    },
    // --- Create a new Card API --- 
    createNewCard: async (formData: CreateCardFormData) => {
        set({ isCreatingCard: true, createCardError: null });
        try {
            // --- Call the API to create the Card --- 
            const newCard = await createCard(formData);
            // --- Close dialog and refresh Cards --- 
            set({ isCreatingCard: false });
            get().closeAddCardDialog();
            // --- Refresh the Card List --- 
            await get().fetchCards();
            return true;
        } catch (error) {
            set({ createCardError: "Failed to create card.", isCreatingCard: false });
            return false;
        }
    },

    // --- AI Copilot State ---
    isCopilotOpen: false,
    copilotContext: "",
    copilotMessages: [],
    isCopilotLoading: false,
    copilotError: null,

    // --- Toggle the visibility of the Copilot chat window ---
    toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),

    // --- Set the context for the chat, typically called when the blog page loads ---
    // --- Also clears previous chat history ---
    setCopilotContext: (context: string) => {
        set({
            copilotContext: context,
            copilotMessages: [],
            copilotError: null,
        });
    },

    // --- Clear the chat messages, useful for a 'reset' button ---
    clearCopilotChat: () => set({ copilotMessages: [], copilotError: null }),

    // --- Handle sending a message to the AI ---
    sendCopilotMessage: async (question: string) => {
        const context = get().copilotContext;
        if (!question.trim() || !context) return;

        // --- Add user's message to the chat history optimistically ---
        set((state) => ({
            isCopilotLoading: true,
            copilotError: null,
            copilotMessages: [
                ...state.copilotMessages,
                { role: "user", content: question },
            ],
        }));

        try {
            // --- Call the API ---
            const response = await askCopilot({ question, context });

            // --- Add AI's response to the chat history ---
            set((state) => ({
                copilotMessages: [
                    ...state.copilotMessages,
                    { role: "ai", content: response.answer },
                ],
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            set({ copilotError: errorMessage });
        } finally {
            set({ isCopilotLoading: false });
        }
    },

    // --- AI Bias Judge State ---
    biasJudgeResult: null,
    isBiasJudgeLoading: false,
    biasJudgeError: null,

    // --- Action to analyze content for bias ---
    analyzeBias: async (content: string) => {
        if (!content || content.length < 50) {
            set({ biasJudgeError: "Content must be at least 50 characters long." });
            return;
        }

        set({ isBiasJudgeLoading: true, biasJudgeError: null });
        try {
            const result = await analyzeForBias({ blog_content: content });
            set({ biasJudgeResult: result });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            set({ biasJudgeError: errorMessage });
        } finally {
            set({ isBiasJudgeLoading: false });
        }
    },

    // --- Reset the bias judge state ---
    resetBiasJudge: () => {
        set({
            biasJudgeResult: null,
            biasJudgeError: null,
            isBiasJudgeLoading: false,
        });
    },
}));
