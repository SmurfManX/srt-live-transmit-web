"""Database module - JSON config file operations for user management"""

import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
from filelock import FileLock

from .core.security import hash_password, verify_password

CONFIG_FILE = Path("config.json")
CONFIG_LOCK = Path("config.json.lock")


def _load_config() -> Dict[str, Any]:
    """Load full config from JSON file"""
    if not CONFIG_FILE.exists():
        return {"channels": [], "users": []}
    try:
        with open(CONFIG_FILE, 'r') as f:
            data = json.load(f)
            # Migration: if config is a list (old format), convert to new format
            if isinstance(data, list):
                return {"channels": data, "users": []}
            return data
    except (json.JSONDecodeError, IOError):
        return {"channels": [], "users": []}


def _save_config(config: Dict[str, Any]):
    """Save full config to JSON file"""
    with FileLock(CONFIG_LOCK):
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2, default=str)


def _get_users() -> List[Dict[str, Any]]:
    """Get users list from config"""
    config = _load_config()
    return config.get("users", [])


def _save_users(users: List[Dict[str, Any]]):
    """Save users list to config"""
    config = _load_config()
    config["users"] = users
    _save_config(config)


def _get_next_id(users: List[Dict[str, Any]]) -> int:
    """Get next available user ID"""
    if not users:
        return 1
    return max(u.get('id', 0) for u in users) + 1


def _is_hashed_password(password: str) -> bool:
    """Check if password is already hashed (bcrypt format)"""
    return password.startswith('$2b$') or password.startswith('$2a$') or password.startswith('$2y$')


def _hash_plain_passwords(users: List[Dict[str, Any]]) -> bool:
    """Hash any plain text passwords in users list. Returns True if any were hashed."""
    changed = False
    for user in users:
        password = user.get('hashed_password', '') or user.get('password', '')
        if password and not _is_hashed_password(password):
            user['hashed_password'] = hash_password(password)
            if 'password' in user:
                del user['password']
            changed = True
            print(f"Password hashed for user: {user.get('username')}")
    return changed


def init_database():
    """Initialize config with default admin user if no users exist"""
    config = _load_config()
    users = config.get("users", [])
    changed = False

    # Hash any plain text passwords
    if _hash_plain_passwords(users):
        changed = True

    # Create default admin user if no users exist
    admin_exists = any(u.get('username') == 'admin' for u in users)
    if not admin_exists:
        users.append({
            'id': _get_next_id(users),
            'username': 'admin',
            'hashed_password': hash_password('admin'),
            'email': 'admin@localhost',
            'is_active': True,
            'created_at': datetime.now().isoformat()
        })
        changed = True
        print("Default admin user created (admin/admin)")

    if changed:
        config["users"] = users
        _save_config(config)


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username"""
    users = _get_users()
    for user in users:
        if user.get('username') == username:
            return user
    return None


def create_user(username: str, password: str, email: str = None) -> bool:
    """Create a new user"""
    users = _get_users()

    # Check if username already exists
    if any(u.get('username') == username for u in users):
        return False

    users.append({
        'id': _get_next_id(users),
        'username': username,
        'hashed_password': hash_password(password),
        'email': email,
        'is_active': True,
        'created_at': datetime.now().isoformat()
    })
    _save_users(users)
    return True


def update_user_password(username: str, new_password: str) -> bool:
    """Update user password"""
    users = _get_users()

    for user in users:
        if user.get('username') == username:
            user['hashed_password'] = hash_password(new_password)
            _save_users(users)
            return True
    return False


def delete_user(username: str) -> bool:
    """Delete a user (cannot delete admin)"""
    if username == 'admin':
        return False

    users = _get_users()
    original_count = len(users)
    users = [u for u in users if u.get('username') != username]

    if len(users) < original_count:
        _save_users(users)
        return True
    return False


def list_users() -> List[Dict[str, Any]]:
    """List all users (without passwords)"""
    users = _get_users()
    return [
        {
            'id': u.get('id'),
            'username': u.get('username'),
            'email': u.get('email'),
            'is_active': u.get('is_active'),
            'created_at': u.get('created_at')
        }
        for u in users
    ]


def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate a user"""
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.get('hashed_password', '')):
        return None
    return user
