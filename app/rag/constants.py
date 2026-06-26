"""Shared constants for Nepal curriculum RAG."""

from enum import StrEnum


class Subject(StrEnum):
    SCIENCE = "science"
    MATHEMATICS = "mathematics"
    SOCIAL_STUDIES = "social_studies"


class Grade(StrEnum):
    SIX = "6"
    SEVEN = "7"
    EIGHT = "8"


SUPPORTED_GRADES: tuple[int, ...] = (6, 7, 8)
SUPPORTED_SUBJECTS: tuple[str, ...] = tuple(s.value for s in Subject)

CURRICULUM_COLLECTION = "curriculum"
PREVIEW_MAX_CHARS = 300
DEFAULT_CHUNK_SIZE = 800
DEFAULT_CHUNK_OVERLAP = 100
