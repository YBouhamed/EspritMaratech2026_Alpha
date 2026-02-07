"""
Sign Processor Module

Handles linguistic processing and sign mapping for LST translation.

Responsibilities:
- Text normalization (case, accents, punctuation)
- Tokenization
- Word-to-sign mapping
- LST grammar transformations (future)
- Sequence optimization

Extensibility:
- Can be enhanced with LST-specific grammar rules
- Support for compound signs (multi-word → single sign)
- Contextual sign selection based on semantic analysis
"""

import unicodedata
import string
import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class SignMatch:
    """
    Represents a successful word → sign mapping
    """
    word: str                # Original normalized word
    sign_id: str            # Sign identifier (matches animation/video filename)
    confidence: float = 1.0  # Future: confidence score for ambiguous matches
    metadata: Dict = None    # Future: additional sign metadata
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class SignSequence:
    """
    Represents an ordered sequence of signs
    """
    matched_signs: List[SignMatch]
    missing_words: List[str]
    original_text: str
    normalized_text: str
    
    def __len__(self):
        return len(self.matched_signs)
    
    def get_sign_ids(self) -> List[str]:
        """Return list of sign IDs in order"""
        return [sign.sign_id for sign in self.matched_signs]


class SignProcessor:
    """
    Main class for processing text into LST sign sequences
    
    Features:
    - Text normalization
    - Word tokenization
    - Sign mapping
    - Future: LST grammar transformations
    """
    
    def __init__(self, sign_database: Dict[str, str]):
        """
        Initialize the sign processor
        
        Args:
            sign_database: Dictionary mapping normalized words to sign IDs
                          e.g., {"medecin": "medecin", "coeur": "coeur"}
        """
        self.sign_database = sign_database
        self.compound_signs = {}  # Future: multi-word signs
        self.grammar_rules = []   # Future: LST grammar transformations
        
    def process_text(self, text: str) -> SignSequence:
        """
        Main processing pipeline: text → sign sequence
        
        Pipeline:
        1. Normalize text
        2. Tokenize into words
        3. Apply grammar transformations (future)
        4. Map words to signs
        5. Return sign sequence
        
        Args:
            text: Input text to translate
        
        Returns:
            SignSequence object with matched signs and missing words
        """
        # Step 1: Normalize
        normalized = self.normalize_text(text)
        
        # Step 2: Tokenize
        words = self.tokenize(normalized)
        
        # Step 3: Grammar transformations (future)
        # words = self.apply_grammar_rules(words)
        
        # Step 4: Map to signs
        matched_signs = []
        missing_words = []
        
        for word in words:
            sign = self._map_word_to_sign(word)
            if sign:
                matched_signs.append(sign)
            else:
                missing_words.append(word)
        
        return SignSequence(
            matched_signs=matched_signs,
            missing_words=missing_words,
            original_text=text,
            normalized_text=normalized
        )
    
    def normalize_text(self, text: str) -> str:
        """
        Normalize text for consistent processing
        
        Transformations:
        - Convert to lowercase
        - Remove accents (é → e, à → a)
        - Remove punctuation
        - Normalize whitespace
        
        Args:
            text: Input text
        
        Returns:
            Normalized text
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove accents - NFD normalization separates base chars from diacritics
        text = unicodedata.normalize('NFD', text)
        text = ''.join(
            char for char in text 
            if unicodedata.category(char) != 'Mn'  # Mn = Mark, Nonspacing
        )
        
        # Remove punctuation
        text = text.translate(str.maketrans('', '', string.punctuation))
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
    def tokenize(self, text: str) -> List[str]:
        """
        Split text into words
        
        Current: Simple whitespace splitting
        Future: Handle compound words, contractions
        
        Args:
            text: Normalized text
        
        Returns:
            List of words
        """
        words = text.split()
        
        # Future: detect compound signs
        # words = self._detect_compound_signs(words)
        
        return words
    
    def _map_word_to_sign(self, word: str) -> Optional[SignMatch]:
        """
        Map a single word to a sign
        
        Args:
            word: Normalized word
        
        Returns:
            SignMatch if found, None otherwise
        """
        if word in self.sign_database:
            return SignMatch(
                word=word,
                sign_id=self.sign_database[word],
                confidence=1.0
            )
        
        # Future: fuzzy matching, stemming, synonym lookup
        return None
    
    # ===== Future Extensibility Methods =====
    
    def apply_grammar_rules(self, words: List[str]) -> List[str]:
        """
        Apply LST-specific grammar transformations
        
        LST (like many sign languages) has different word order than French.
        
        Example transformations:
        - French: "Je vais à l'hôpital"
        - LST word order: "hôpital je aller" (topic-comment structure)
        
        FUTURE IMPLEMENTATION
        
        Args:
            words: List of words in French order
        
        Returns:
            List of words in LST order
        """
        # Placeholder for future grammar engine
        return words
    
    def _detect_compound_signs(self, words: List[str]) -> List[str]:
        """
        Detect multi-word phrases that map to single signs
        
        Example:
        - ["salle", "de", "attente"] → ["salle_de_attente"]
        - ["médecin", "généraliste"] → ["medecin_generaliste"]
        
        FUTURE IMPLEMENTATION
        
        Args:
            words: List of individual words
        
        Returns:
            List with compound words merged
        """
        # Placeholder for future compound sign detection
        return words
    
    def add_compound_sign(self, phrase: str, sign_id: str):
        """
        Register a compound sign (multi-word → single sign)
        
        FUTURE FEATURE
        
        Args:
            phrase: Multi-word phrase (e.g., "salle de attente")
            sign_id: Corresponding sign identifier
        """
        normalized_phrase = self.normalize_text(phrase)
        self.compound_signs[normalized_phrase] = sign_id
    
    def add_grammar_rule(self, rule):
        """
        Add a grammar transformation rule
        
        FUTURE FEATURE
        
        Args:
            rule: Grammar rule object (to be defined)
        """
        self.grammar_rules.append(rule)
    
    def get_statistics(self) -> Dict:
        """
        Get processor statistics
        
        Returns:
            Dictionary with statistics
        """
        return {
            "total_signs": len(self.sign_database),
            "compound_signs": len(self.compound_signs),
            "grammar_rules": len(self.grammar_rules),
        }


# ===== Future: Grammar Rule System (Research) =====

class GrammarRule:
    """
    Abstract base class for LST grammar transformations
    
    FUTURE RESEARCH COMPONENT
    
    Subclasses can implement specific rules:
    - TopicCommentReordering: Move topic to front
    - NegationHandling: LST negation syntax
    - QuestionFormation: Question word order
    - SpatialReferencing: Pronoun placement in virtual space
    """
    
    def apply(self, words: List[str], context: Dict) -> List[str]:
        """
        Apply grammar transformation
        
        Args:
            words: Input word sequence
            context: Contextual information (sentence type, etc.)
        
        Returns:
            Transformed word sequence
        """
        raise NotImplementedError("Subclass must implement apply()")


class TopicCommentRule(GrammarRule):
    """
    Example grammar rule: Topic-Comment structure
    
    LST often uses Topic-Comment word order:
    - French: "Je vais à l'hôpital demain"
    - LST: "demain hôpital je aller"
    
    FUTURE IMPLEMENTATION
    """
    
    def apply(self, words: List[str], context: Dict) -> List[str]:
        # Placeholder
        # Detect time/location words
        # Move them to the front (topic position)
        # Rearrange remaining words
        return words


# ===== Utility Functions =====

def create_sign_database_from_files(file_list: List[str]) -> Dict[str, str]:
    """
    Create a sign database from a list of filenames
    
    Useful for building the sign_database from video or animation files.
    
    Args:
        file_list: List of filenames (e.g., ["medecin.mp4", "coeur.fbx"])
    
    Returns:
        Dictionary mapping normalized words to sign IDs
    """
    import os
    database = {}
    
    processor = SignProcessor({})  # Temporary instance for normalization
    
    for filename in file_list:
        # Remove extension
        name, ext = os.path.splitext(filename)
        
        # Normalize the name
        normalized = processor.normalize_text(name)
        
        # Use normalized name as both key and value
        # (sign_id same as normalized word)
        if normalized and normalized not in database:
            database[normalized] = normalized
    
    return database


if __name__ == "__main__":
    # Example usage for testing
    
    # Create a sample database
    sample_db = {
        "medecin": "medecin",
        "infirmier": "infirmier",
        "coeur": "coeur",
        "poumons": "poumons",
        "hopital": "hopital"
    }
    
    # Initialize processor
    processor = SignProcessor(sample_db)
    
    # Test text
    test_texts = [
        "Médecin infirmier",
        "Le cœur et les poumons",
        "Je vais à l'hôpital",
        "Chirurgien dentiste"  # chirurgien not in database
    ]
    
    print("=== Sign Processor Test ===\n")
    
    for text in test_texts:
        result = processor.process_text(text)
        print(f"Input: {text}")
        print(f"Normalized: {result.normalized_text}")
        print(f"Matched: {[s.word for s in result.matched_signs]}")
        print(f"Missing: {result.missing_words}")
        print(f"Sign IDs: {result.get_sign_ids()}")
        print()
    
    print(f"Processor stats: {processor.get_statistics()}")
