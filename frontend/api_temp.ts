import { cardsResponseSchema, 
    createCardSchema,
    fullCardSchema,
    copilotRequestSchema,
    copilotResponseSchema,
     } from "./validators"
import type { CreateCardFormData , FullCard, CopilotRequest, CopilotResponse } from "./validators"; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// --- Logic to fetch cards ---
export async function fetchCards(title?: string) {
    const url = new URL(`${API_BASE_URL}/api/v1/cards/`);
    // --- Search by title --- 
    if (title) {
        url.searchParams.append("title",title);
    }
    const response = await fetch(url.toString());

    if (!response.ok){
        throw new Error("Failed to fetch cards");
    }
    // --- Get the data ---
    const data = await response.json();

    // --- Leverage Zod to validate the data --- 
    const validatedData = cardsResponseSchema.parse(data);
    
    return validatedData;
}
// --- Logic to fetch a Single Card --- 
export async function fetchCardById(cardId: string):Promise<FullCard>{
    // --- Get The Url --- 
    const url = `${API_BASE_URL}/api/v1/cards/${cardId}`;
    // --- Get response --- 
    const response = await fetch(url,{
        // --- Add Cache Option --- 
        cache: 'no-store'
    });
    if (!response.ok){
        if (response.status === 404){
           throw new Error(`Card with ID ${cardId} not found.`);
        }
        throw new Error("Failed to fetch card details.");
    }
    // --- Get the data --- 
    const data = await response.json();
    // --- Validate the data --- 
    const validatedData = fullCardSchema.parse(data);
    return validatedData;
}

// --- Logic to Create Card ---
export async function createCard(formData: CreateCardFormData){
    // --- Step One Validate Data --- 
    const validatedData = createCardSchema.parse(formData);
    // --- Construct FormData to support file uploads --- 
    const body = new FormData()
    body.append("title",validatedData.title)
    body.append("system_prompt",validatedData.system_prompt);
    body.append("topics_to_cover", validatedData.topics_to_cover);
    if (validatedData.context_file){
        body.append("context_file",validatedData.context_file);
    }
    // --- Send the POST request to the backend --- 
    const response = await fetch(`${API_BASE_URL}/api/v1/cards/`, {
        method: "POST",
        body: body,
    });
    if (!response.ok){
        // --- Handle Error Response --- 
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create card");
    }
    // --- Return the newly created card --- 
    const newCard = await response.json();
    return newCard;
}
// --- Logic for AI Copilot ---
export async function askCopilot (requestData: CopilotRequest){
    // --- Validate request Data --- 
    const validatedRequest = copilotRequestSchema.parse(requestData)
    // --- Send the Post request --- 
    const response = await fetch(`${API_BASE_URL}/api/v1/ai/copilot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedRequest),
    });
    // --- Handle any errors ---
    if (!response.ok){
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get an answer from the Copilot.");
    }
    // --- Validate and return the successful response --- 
    const data = await response.json();
    const validatedResponse = copilotResponseSchema.parse(data);
    return validatedResponse;
}