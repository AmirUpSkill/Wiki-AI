import logging 
from typing import List , Optional 
from uuid import UUID 
from sqlalchemy.orm import Session 

from app.services.ai_service import AIService , AIServiceError 
from app.crud import CardCRUD 
from app.schemas.card import CardBase , CardResponse 
from app.schemas.ai import CopilotResponse, BiasJudgeResponse 
from app.utils import extract_text_from_pdf

# --- Custom Exceptions ---
class CardServiceError(Exception):
    """
        Base exception for card service errors.
    """
    pass


class CardNotFoundError(CardServiceError):
    """
        Exception raised when a card is not found.
    """
    pass


class AIGenerationError(CardServiceError):
    """
        Exception raised when AI generation fails.
    """
    pass


class PDFParsingError(CardServiceError):
    """
        Exception raised when PDF parsing fails.
    """
    pass

# ---- Card Service Class  --- 
class CardService:
    """
        Service class for handling card operations . 
    """
    def __init__(self, ai_service: AIService):
        """
            Initialize card service .
        """
        self.ai_service = ai_service
        self.logger = logging.getLogger(__name__)
        self.logger.info("CardService initialized")
    # --- Get ALL Cards ---
    def get_cards(
        self,
        db: Session ,
        title_filter: Optional[str] = None,
        skip:int = 0,
        limit: int = 100
    ) -> List[CardResponse]:
        """
            Retrieve multiple cards with optional filtering . 
        """
        try:
            if title_filter:
                self.logger.debug(f"Fetching cards with title filter: '{title_filter}'")
            else:
                self.logger.debug("Fetching all cards")
            cards = CardCRUD.get_multi(
                db,
                title=title_filter,
                skip=skip,
                limit=limit 
            )
            self.logger.info(f"Retrieved {len(cards)} cards")
            # --- Convert to response schemas --- 
            return [CardResponse.model_validate(card) for card in cards]
        except Exception as e:
                self.logger.error(f"Failed to retrieve cards: {e}")
                raise CardServiceError(f"Failed to fetch cards: {e}")
     # --- Get Specific Card --- 
    def get_card(self, db:Session, card_id: UUID) -> CardResponse:
            """
                Retrieve a single card by its unique ID .
            """
            try:
                self.logger.debug(f"Fetching card: id={card_id}")

                # --- get the card ---
                card = CardCRUD.get(db,id=card_id)
                if not card:
                    self.logger.warning(f"Card not found: id={card_id}")
                    raise CardNotFoundError(f"Card with ID {card_id} not found")
            
                self.logger.info(f"Card retrieved: id={card_id}, title='{card.title}'")
                return CardResponse.model_validate(card)
            except CardNotFoundError:
                raise
            except Exception as e:
                self.logger.error(f"Failed to retrieve card {card_id}: {e}")
                raise CardServiceError(f"Failed to fetch card: {e}")
    # --- Create Card --- 
    def create_card_from_ai(
        self,
        db: Session,
        title: str,
        system_prompt: str,
        topcis_to_cover: str,
        pdf_bytes: Optional[bytes] = None 
    ) -> CardResponse:
        """
            Create a new card using AI generation . 
        """
        self.logger.info(f"Starting card creation: title='{title}'")
        # --- 1 . Extract the PDF text to add it to context --- 
        context_text = ""
        if pdf_bytes:
            try:
                self.logger.debug("Parsing PDF context ...")
                extracted_text = extract_text_from_pdf(pdf_bytes)
                if extracted_text:
                    context_text = extracted_text
                    self.logger.info(f"PDF parsed successfully: {len(context_text)} characters")
                else:
                    self.logger.warning("PDF parsing returned empty text")
            except Exception as e :
                self.logger.error(f"Failed to parse PDF context: {e}")
                raise PDFParsingError(f"Failed to parse PDF context: {e}")
        # ---- 2 . Generate Card Using AI --- 
        try:
            self.logger.debug("Calling AI service for card generation ....")
            card_data = self.ai_service.generate_card(
                title=title,
                system_prompt=system_prompt,
                topics_to_cover = topcis_to_cover,
                context_text=context_text
            )
            self.logger.info("AI Generation completed successfully")
        except AIServiceError as e:
            self.logger.error(f"AI generation failed: {e}")
            raise AIGenerationError(f"Failed to generate card: {e}")
        # --- 3 . Create Schema for AI Response ---
        try:
            card_schema = CardBase(
                title=card_data["title"],
                description=card_data["description"],
                keywords = card_data["keywords"]
            )
        except Exception as e:
            self.logger.error(f"Failed to create schema from AI response: {e}")
            raise CardServiceError(f"Invalid AI response structure: {e}")
        # --- 4 . Persist to database --- 
        try:
            self.logger.debug("Saving card to database...")
            db_card = CardCRUD.create(db, card_in=card_schema)
            self.logger.info(f"Card created successfully: id={db_card.id}")
        
        except Exception as e:
            self.logger.error(f"Database operation failed: {e}")
            raise CardServiceError(f"Failed to save card: {e}")
        return CardResponse.model_validate(db_card)
    # --- AI Copilot --- 
    def get_copilot_answer(
        self,
        db: Session,
        card_id: UUID,
        question: str
    ) -> CopilotResponse:
        """
            Generate a copilot answer about a specific card's content . 
        """
        # --- 1.  We need to fetch the card Content --- 
        self.logger.info(f"Copilot request for card {card_id}: '{question}'")
        try:
            card = CardCRUD.get(db, id=card_id)
            if not card:
                raise CardNotFoundError(f"Card with ID {card_id} not found")
        except CardNotFoundError:
            raise
        except Exception as e:
            self.logger.error(f"Failed to fetch card for copilot: {e}")
            raise CardServiceError(f"Failed to fetch card: {e}")
        # --- 2. Now the AI Copilot Generate the answer --- 
        try:
            answer = self.ai_service.copilot_answer(
                question=question,
                context=str(card.description)
            )
            self.logger.info(f"Copilot answer generated for card {card_id}")
            return CopilotResponse(answer=answer)
        except AIServiceError as e:
            self.logger.error(f"Copilot generation failed: {e}")
            raise CardServiceError(f"Failed to generate copilot answer: {e}")
    
    # --- AI Bias Judge --- 
    def get_bias_analysis(
        self,
        db: Session,
        card_id: UUID
    ) -> BiasJudgeResponse:
        """
            Analyze a card's content for potential bias . 
        """
        # --- 1. Fetch the card content --- 
        self.logger.info(f"Bias analysis request for card {card_id}")
        try:
            card = CardCRUD.get(db, id=card_id)
            if not card:
                raise CardNotFoundError(f"Card with ID {card_id} not found")
        except CardNotFoundError:
            raise
        except Exception as e:
            self.logger.error(f"Failed to fetch card for bias analysis: {e}")
            raise CardServiceError(f"Failed to fetch card: {e}")
        # --- 2. Call AI bias judge --- 
        try:
            bias_score, explanation = self.ai_service.judge_bias(
                content=str(card.description)
            )
            self.logger.info(f"Bias analysis completed for card {card_id}: score={bias_score}")
            return BiasJudgeResponse(bias_score=bias_score, explanation=explanation)
        except AIServiceError as e:
            self.logger.error(f"Bias analysis failed: {e}")
            raise CardServiceError(f"Failed to analyze bias: {e}")
