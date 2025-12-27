import logging
from typing import Tuple, Dict, Any

logger = logging.getLogger(__name__)

class BiasValidationError(Exception):
    """
        Exception raised when bias data validation fails.
    """
    pass

def validate_bias_response(bias_data: Dict[str, Any]) -> Tuple[float, str]:
    """
    Validate bias judge response and extract score and explanation.
    
    Args:
        bias_data: The parsed bias judge response from Gemini
    
    Returns:
        Tuple of (bias_score, explanation)
    
    Raises:
        BiasValidationError: If validation fails
    """
    # --- Check required fields ---
    if "bias_score" not in bias_data or "explanation" not in bias_data:
        raise BiasValidationError("Invalid bias judge response format")
    
    try:
        bias_score = float(bias_data["bias_score"])
        explanation = str(bias_data["explanation"])
    except (ValueError, TypeError) as e:
        raise BiasValidationError(f"Failed to extract bias data: {e}")
    
    # --- Validate score range (0-100) ---
    if not (0.0 <= bias_score <= 100.0):
        raise BiasValidationError(f"Bias score out of range: {bias_score}")
    
    # --- Validate explanation is not empty ---
    if not explanation or len(explanation) < 10:
        raise BiasValidationError("Bias explanation must be at least 10 characters")
    
    logger.debug(f"Bias response validated: score={bias_score}")
    return bias_score, explanation