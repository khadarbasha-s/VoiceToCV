"""
Validation utilities for CV data.
"""
import re
from typing import Optional, Dict, Any


def validate_email(email: str) -> tuple[bool, Optional[str]]:
    """
    Validate email address format.
    Returns: (is_valid, corrected_email or None)
    """
    if not email or not isinstance(email, str):
        return False, None
    
    email = email.strip().lower()
    
    # Basic email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if re.match(pattern, email):
        return True, email
    
    # Try to fix common issues
    # Remove spaces
    email = email.replace(' ', '')
    # Fix common domain typos
    email = email.replace('@gmail.con', '@gmail.com')
    email = email.replace('@gmial.com', '@gmail.com')
    email = email.replace('@gmail.co', '@gmail.com')
    email = email.replace('@yahoo.con', '@yahoo.com')
    email = email.replace('@yahoo.co', '@yahoo.com')
    email = email.replace('@outlook.con', '@outlook.com')
    email = email.replace('@outlook.co', '@outlook.com')
    
    if re.match(pattern, email):
        return True, email
    
    return False, None


def validate_phone(phone: str) -> tuple[bool, Optional[str]]:
    """
    Validate and normalize phone number.
    Supports formats: +91 1234567890, 1234567890, (123) 456-7890, etc.
    Returns: (is_valid, normalized_phone or None)
    """
    if not phone or not isinstance(phone, str):
        return False, None
    
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Remove leading + if present for processing
    has_plus = cleaned.startswith('+')
    digits_only = cleaned.lstrip('+')
    
    # Check if it's a valid length (7-15 digits is standard)
    if len(digits_only) < 7 or len(digits_only) > 15:
        return False, None
    
    # Format Indian numbers (10 digits, optionally with country code)
    if len(digits_only) == 10:
        # Indian mobile number
        formatted = f"+91 {digits_only[:5]} {digits_only[5:]}"
        return True, formatted
    elif len(digits_only) == 12 and digits_only.startswith('91'):
        # Indian number with country code
        formatted = f"+{digits_only[:2]} {digits_only[2:7]} {digits_only[7:]}"
        return True, formatted
    elif len(digits_only) >= 10:
        # International format
        if has_plus:
            formatted = f"+{digits_only}"
        else:
            formatted = digits_only
        return True, formatted
    
    return False, None


def validate_url(url: str, url_type: str = "generic") -> tuple[bool, Optional[str]]:
    """
    Validate URL format (GitHub, LinkedIn, Portfolio, etc.)
    Returns: (is_valid, corrected_url or None)
    """
    if not url or not isinstance(url, str):
        return False, None
    
    url = url.strip()
    
    # Add https:// if missing
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    # Basic URL pattern
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    
    if re.match(pattern, url):
        # Validate specific URL types
        if url_type == "github":
            if 'github.com' in url.lower() or url.startswith('https://github.com/'):
                return True, url
        elif url_type == "linkedin":
            if 'linkedin.com' in url.lower() or url.startswith('https://linkedin.com/'):
                return True, url
        elif url_type == "portfolio":
            # Portfolio can be any valid URL
            return True, url
        else:
            return True, url
    
    return False, None


def auto_correct_name(name: str) -> str:
    """
    Auto-correct common name spelling mistakes.
    """
    if not name or not isinstance(name, str):
        return ""
    
    name = name.strip()
    
    # Common corrections
    corrections = {
        "kadar": "Khadar",
        "khadar": "Khadar",
        "basha": "Basha",
        "bash": "Basha",
    }
    
    # Split name into parts
    parts = name.split()
    corrected_parts = []
    
    for part in parts:
        part_lower = part.lower()
        if part_lower in corrections:
            # Preserve original casing if it's already capitalized
            if part[0].isupper():
                corrected_parts.append(corrections[part_lower].title())
            else:
                corrected_parts.append(corrections[part_lower])
        else:
            corrected_parts.append(part.title())
    
    # Join and ensure proper title case
    corrected = " ".join(corrected_parts)
    return corrected


def validate_and_correct_personal_info(personal_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and auto-correct all personal information fields.
    Returns corrected personal_info dict.
    """
    corrected = {}
    
    # Name validation and correction
    if "name" in personal_info and personal_info["name"]:
        corrected["name"] = auto_correct_name(personal_info["name"])
    
    # Email validation
    if "email" in personal_info and personal_info["email"]:
        is_valid, corrected_email = validate_email(personal_info["email"])
        if is_valid and corrected_email:
            corrected["email"] = corrected_email
        elif personal_info["email"]:  # Keep original if validation fails but value exists
            corrected["email"] = personal_info["email"]
    
    # Phone validation
    if "phone" in personal_info and personal_info["phone"]:
        is_valid, corrected_phone = validate_phone(personal_info["phone"])
        if is_valid and corrected_phone:
            corrected["phone"] = corrected_phone
        elif personal_info["phone"]:  # Keep original if validation fails
            corrected["phone"] = personal_info["phone"]
    
    # Address (no specific validation, just clean)
    if "address" in personal_info and personal_info["address"]:
        corrected["address"] = personal_info["address"].strip()
    
    # Social links
    if "github" in personal_info and personal_info["github"]:
        is_valid, corrected_url = validate_url(personal_info["github"], "github")
        if is_valid and corrected_url:
            corrected["github"] = corrected_url
        else:
            # Try to construct GitHub URL from username
            username = personal_info["github"].strip().lstrip('@').split('/')[-1]
            corrected["github"] = f"https://github.com/{username}"
    
    if "linkedin" in personal_info and personal_info["linkedin"]:
        is_valid, corrected_url = validate_url(personal_info["linkedin"], "linkedin")
        if is_valid and corrected_url:
            corrected["linkedin"] = corrected_url
        else:
            # Try to construct LinkedIn URL from username
            username = personal_info["linkedin"].strip().lstrip('@').split('/')[-1]
            corrected["linkedin"] = f"https://linkedin.com/in/{username}"
    
    if "portfolio" in personal_info and personal_info["portfolio"]:
        is_valid, corrected_url = validate_url(personal_info["portfolio"], "portfolio")
        if is_valid and corrected_url:
            corrected["portfolio"] = corrected_url
    
    return corrected

