"""Database module - SQLite operations for user management"""

import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Optional, List, Dict, Any

from .core.security import hash_password, verify_password

DB_PATH = Path("srt_manager.db")


def init_database():
    """Initialize the SQLite database with users table"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            email TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create default admin user if not exists
    cursor.execute('SELECT COUNT(*) FROM users WHERE username = ?', ('admin',))
    if cursor.fetchone()[0] == 0:
        hashed_password = hash_password('admin')
        cursor.execute('''
            INSERT INTO users (username, hashed_password, email)
            VALUES (?, ?, ?)
        ''', ('admin', hashed_password, 'admin@localhost'))
        print("Default admin user created (admin/admin)")

    conn.commit()
    conn.close()


@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user from database by username"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None


def create_user(username: str, password: str, email: str = None) -> bool:
    """Create a new user"""
    hashed_password = hash_password(password)
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO users (username, hashed_password, email)
                VALUES (?, ?, ?)
            ''', (username, hashed_password, email))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False


def update_user_password(username: str, new_password: str) -> bool:
    """Update user password"""
    hashed_password = hash_password(new_password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE users
            SET hashed_password = ?
            WHERE username = ?
        ''', (hashed_password, username))
        conn.commit()
        return cursor.rowcount > 0


def delete_user(username: str) -> bool:
    """Delete a user"""
    if username == 'admin':
        return False  # Prevent deleting admin
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM users WHERE username = ?', (username,))
        conn.commit()
        return cursor.rowcount > 0


def list_users() -> List[Dict[str, Any]]:
    """List all users"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email, is_active, created_at FROM users')
        return [dict(row) for row in cursor.fetchall()]


def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate a user against database"""
    user_dict = get_user_by_username(username)
    if not user_dict:
        return None
    if not verify_password(password, user_dict['hashed_password']):
        return None
    return user_dict
