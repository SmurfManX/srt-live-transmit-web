"""
Path Sanitizer - Protection against Path Traversal attacks
"""
import re
from pathlib import Path
from typing import Union


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal

    Args:
        filename: Original filename

    Returns:
        Sanitized filename safe for file system operations

    Raises:
        ValueError: If filename is invalid or dangerous
    """
    if not filename:
        raise ValueError("Filename cannot be empty")

    # Remove any path separators
    filename = filename.replace('/', '_').replace('\\', '_')

    # Remove potentially dangerous characters
    filename = re.sub(r'[^\w\s\-\.]', '', filename)

    # Remove leading/trailing dots and spaces
    filename = filename.strip('. ')

    # Collapse multiple spaces/dashes
    filename = re.sub(r'[-\s]+', '_', filename)

    # Limit length
    if len(filename) > 100:
        # Keep extension if present
        parts = filename.rsplit('.', 1)
        if len(parts) == 2:
            name, ext = parts
            filename = name[:95] + '.' + ext[:4]
        else:
            filename = filename[:100]

    # Final check - must have at least one character
    if not filename or filename == '.':
        raise ValueError("Filename resulted in empty string after sanitization")

    return filename


def get_safe_path(base_dir: Path, filename: str) -> Path:
    """
    Get safe file path preventing directory traversal

    Args:
        base_dir: Base directory (must exist)
        filename: Filename to append

    Returns:
        Absolute path within base_dir

    Raises:
        ValueError: If path would escape base_dir or is invalid
    """
    # Ensure base_dir is absolute
    base_dir = base_dir.resolve()

    # Sanitize filename
    safe_filename = sanitize_filename(filename)

    # Build full path
    full_path = (base_dir / safe_filename).resolve()

    # Critical check: ensure path is within base_dir
    try:
        full_path.relative_to(base_dir)
    except ValueError:
        raise ValueError(
            f"Path traversal attempt detected: {filename} would escape {base_dir}"
        )

    return full_path


def ensure_directory_exists(directory: Union[str, Path]) -> Path:
    """
    Ensure directory exists, create if necessary

    Args:
        directory: Directory path

    Returns:
        Absolute directory path

    Raises:
        ValueError: If path is not a directory or cannot be created
    """
    dir_path = Path(directory).resolve()

    if dir_path.exists():
        if not dir_path.is_dir():
            raise ValueError(f"{dir_path} exists but is not a directory")
    else:
        try:
            dir_path.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            raise ValueError(f"Failed to create directory {dir_path}: {e}")

    return dir_path
