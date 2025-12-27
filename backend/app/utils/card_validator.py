import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class CardValidationError(Exception):
    """
        Exception raised when card validation fails.
    """
    pass

def validate_card_structure(card_data: Dict[str, Any]) -> None:
    """
    Validate that card data has required structure and valid content.
    
    Checks:
    - Required fields present (title, description, keywords)
    - Correct data types
    - Minimum content lengths
    - Field value constraints
    
    Args:
        card_data: The card data to validate
    
    Raises:
        CardValidationError: If structure or content is invalid
    """
    # --- Check required fields exist ----
    required_fields = {"title", "description", "keywords"}
    missing_fields = required_fields - set(card_data.keys())
    
    if missing_fields:
        raise CardValidationError(
            f"Card is missing required fields: {missing_fields}"
        )
    
    # --- Validate types ---
    if not isinstance(card_data["title"], str):
        raise CardValidationError("Card title must be a string")
    
    if not isinstance(card_data["description"], str):
        raise CardValidationError("Card description must be a string")
    
    if not isinstance(card_data["keywords"], list):
        raise CardValidationError("Card keywords must be a list")
    
    if not all(isinstance(k, str) for k in card_data["keywords"]):
        raise CardValidationError("All keywords must be strings")
    
    # Validate content length
    if len(card_data["title"]) < 1 or len(card_data["title"]) > 200:
        raise CardValidationError("Card title must be between 1 and 200 characters")
    
    if len(card_data["description"]) < 10:
        raise CardValidationError("Card description must be at least 10 characters")
    
    if len(card_data["keywords"]) < 1:
        raise CardValidationError("Card must have at least one keyword")
    
    logger.debug("Card structure validated successfully")