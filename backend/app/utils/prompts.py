"""
Prompt templates for AI interactions.

This module contains reusable, parameterized prompt templates for:
- Card generation (historical event content)
- Copilot assistance (context-aware Q&A)
- Bias judgment (content analysis)

Templates are centralized here for easy maintenance, version control,
and independent testing.
"""

# =============================================================================
# CARD GENERATION PROMPT
# =============================================================================

CARD_GENERATION_PROMPT = """
You are a historian and content creator specializing in Middle Eastern history and politics.

Your task: Generate a comprehensive, well-researched historical event card.

TITLE: {title}
SYSTEM PROMPT (Your perspective/angle): {system_prompt}
TOPICS TO COVER: {topics_to_cover}

{context_section}

Please generate a response in the following JSON format:
{{
  "title": "The exact title of the event",
  "description": "A detailed, markdown-formatted description of the historical event. Include sections with ## headers, use **bold** for emphasis, and structure the content logically. Aim for 500-1000 words.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}}

Guidelines:
1. Be historically accurate and cite sources where relevant
2. Present multiple perspectives on the event
3. Use clear, accessible language
4. Structure the content with headers and bullet points where appropriate
5. Ensure the keywords are relevant and searchable

Return ONLY the JSON object, no additional text.
"""

# Context section to be inserted conditionally if PDF is provided
CONTEXT_INSERTION = """
ADDITIONAL CONTEXT FROM PROVIDED DOCUMENT:
{context_text}

Use this context to inform and enhance your response, but also supplement with your knowledge.
"""


# =============================================================================
# COPILOT ASSISTANT PROMPT
# =============================================================================

COPILOT_PROMPT = """
You are a helpful, knowledgeable assistant for a historical event reference platform.

QUESTION FROM USER: {question}

DOCUMENT CONTEXT:
{context}

Your task: Answer the user's question based on the provided document context. 
- If you can answer directly from the context, provide a clear answer.
- If the context contains partial information, share what you can and note what's missing.
- If the answer cannot be found in the context at all, politely explain this and suggest what kind of information would help.
- You may use your general knowledge to provide context or clarification, but always prioritize information from the provided document.

Keep your answer:
- Clear and conversational
- Helpful and informative
- Accurate and factual
- In plain, accessible language

Respond with the answer only, no preamble.
"""


# =============================================================================
# BIAS JUDGE PROMPT
# =============================================================================

BIAS_JUDGE_PROMPT = """
You are an expert in media analysis and bias detection.

Your task: Analyze the following historical content for neutrality and potential bias.

CONTENT TO ANALYZE:
{content}

Please evaluate the content and return a JSON response in this format:
{{
  "bias_score": <a number from 0.0 to 100.0>,
  "explanation": "A detailed explanation of your analysis"
}}

Where:
- 0-20: Highly neutral and objective
- 21-40: Mostly neutral with minor bias
- 41-60: Balanced but with noticeable bias
- 61-80: Significantly biased
- 81-100: Extremely biased

Evaluation criteria:
1. **Loaded Language:** Check for emotionally charged adjectives or adverbs that inject opinion
2. **Framing:** Assess if events are presented from a single perspective or multiple viewpoints
3. **Attribution:** Look for one-sided attribution of motives or blame
4. **Omissions:** Note important facts or perspectives that are absent
5. **Evidence:** Check if claims are supported or merely asserted
6. **Neutrality:** Consider if the tone maintains professional distance or leans persuasive

Return ONLY the JSON object with bias_score (float) and explanation (string), no additional text.
"""


# =============================================================================
# PROMPT BUILDER FUNCTIONS
# =============================================================================

def build_card_generation_prompt(
    title: str,
    system_prompt: str,
    topics_to_cover: str,
    context_text: str = None,
) -> str:
    """
    Build the card generation prompt with all parameters.
    
    Args:
        title: The event or topic title
        system_prompt: Custom instructions for AI perspective
        topics_to_cover: Specific aspects to include
        context_text: Optional extracted text from PDF
    
    Returns:
        The complete prompt string ready for Gemini
    """
    context_section = ""
    if context_text:
        context_section = CONTEXT_INSERTION.format(context_text=context_text)
    
    return CARD_GENERATION_PROMPT.format(
        title=title,
        system_prompt=system_prompt,
        topics_to_cover=topics_to_cover,
        context_section=context_section,
    )


def build_copilot_prompt(question: str, context: str) -> str:
    """
    Build the copilot assistant prompt.
    
    Args:
        question: The user's question
        context: The full blog/card content
    
    Returns:
        The complete prompt string ready for Gemini
    """
    return COPILOT_PROMPT.format(question=question, context=context)


def build_bias_judge_prompt(content: str) -> str:
    """
    Build the bias judge prompt.
    
    Args:
        content: The blog content to analyze
    
    Returns:
        The complete prompt string ready for Gemini
    """
    return BIAS_JUDGE_PROMPT.format(content=content)