import sqlite3
import json
import logging
import time
from typing import Optional, Dict, List, Any

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, db_path="users.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # --- 1. Users Table Update ---
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT UNIQUE,
                    is_admin BOOLEAN DEFAULT 0,
                    power_balance INTEGER DEFAULT 500,
                    ip_address TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            self._add_column_if_not_exists(cursor, "users", "email", "TEXT UNIQUE")
            self._add_column_if_not_exists(cursor, "users", "power_balance", "INTEGER DEFAULT 500")
            self._add_column_if_not_exists(cursor, "users", "ip_address", "TEXT")
            self._add_column_if_not_exists(cursor, "users", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

            # --- 2. User Data (Settings/Chars) ---
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_data (
                    user_id INTEGER,
                    data_type TEXT NOT NULL,
                    json_content TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, data_type),
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            ''')
            
            # --- 3. AI Models (Admin Managed) ---
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ai_models (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    model_id TEXT NOT NULL, 
                    provider TEXT NOT NULL, 
                    api_url TEXT,
                    api_key TEXT,
                    power_cost INTEGER DEFAULT 15,
                    context_length INTEGER DEFAULT 4096,
                    enabled BOOLEAN DEFAULT 1
                )
            ''')
            
            # --- 4. Power Ledger (Audit Log) ---
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS power_ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    change INTEGER NOT NULL, 
                    balance_after INTEGER NOT NULL,
                    reason TEXT NOT NULL, 
                    model_id INTEGER,
                    request_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            ''')
            
            # --- 5. Verification Codes (Temp) ---
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS verification_codes (
                    email TEXT NOT NULL,
                    code TEXT NOT NULL,
                    ip TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    is_used BOOLEAN DEFAULT 0
                )
            ''')

            # --- 6. Recharge Codes (CD-Keys) ---
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS recharge_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    value INTEGER NOT NULL,
                    is_used BOOLEAN DEFAULT 0,
                    used_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    used_at TIMESTAMP
                )
            ''')

            # --- 7. System Config (Shop Text, etc) ---
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_config (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            ''')

            # Ensure Admin exists
            cursor.execute("SELECT * FROM users WHERE username = 'admin'")
            if not cursor.fetchone():
                cursor.execute("INSERT INTO users (username, password, is_admin, power_balance, email) VALUES (?, ?, ?, ?, ?)", 
                             ('admin', 'admin123', 1, 9999999, 'admin@localhost'))
            
            # Ensure Default Models exist
            cursor.execute("SELECT count(*) FROM ai_models")
            if cursor.fetchone()[0] == 0:
                default_models = [
                    ('GPT-3.5 Turbo', 'gpt-3.5-turbo', 'openai', 'https://api.openai.com/v1', '', 15, 16385),
                    ('GPT-4o', 'gpt-4o', 'openai', 'https://api.openai.com/v1', '', 150, 128000),
                    ('DeepSeek Chat', 'deepseek-chat', 'openai', 'https://api.deepseek.com', '', 10, 32000),
                ]
                cursor.executemany(
                    "INSERT INTO ai_models (name, model_id, provider, api_url, api_key, power_cost, context_length) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    default_models
                )

            # Ensure Default Config
            cursor.execute("INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)", 
                           ("shop_notice", "请联系管理员购买充值卡。\n支持支付宝/微信。\n(管理员可在后台修改此公告)"))
            cursor.execute("INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)", 
                           ("registration_enabled", "true"))

            conn.commit()

    def _add_column_if_not_exists(self, cursor, table, column, definition):
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        except sqlite3.OperationalError:
            pass # Column likely exists

    # --- User Management ---

    def create_user(self, username, password, email, ip_address):
        # Check global registration switch
        if self.get_config("registration_enabled") != "true":
            return False # Locked

        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO users (username, password, email, ip_address, power_balance) VALUES (?, ?, ?, ?, ?)", 
                    (username, password, email, ip_address, 500)
                )
                user_id = cursor.lastrowid
                
                # Initial Ledger Entry
                cursor.execute(
                    "INSERT INTO power_ledger (user_id, change, balance_after, reason) VALUES (?, ?, ?, ?)",
                    (user_id, 500, 500, 'init')
                )
                conn.commit()
                return True
        except sqlite3.IntegrityError:
            return False

    def get_user_by_auth(self, username, password):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_user_by_id(self, user_id):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def check_ip_registered(self, ip):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT count(*) FROM users WHERE ip_address = ?", (ip,))
            return cursor.fetchone()[0] > 0

    # --- Verification Codes ---
    
    def save_verification_code(self, email, code, ip, expires_at):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO verification_codes (email, code, ip, expires_at) VALUES (?, ?, ?, ?)",
                (email, code, ip, expires_at)
            )
            conn.commit()

    def get_valid_code(self, email, code):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND is_used = 0 AND expires_at > ?",
                (email, code, time.time())
            )
            return cursor.fetchone()

    def mark_code_used(self, email, code):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE verification_codes SET is_used = 1 WHERE email = ? AND code = ?",
                (email, code)
            )
            conn.commit()

    def get_ip_code_stats(self, ip):
        now = time.time()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT created_at FROM verification_codes WHERE ip = ? AND created_at > ?", (ip, now - 86400))
            timestamps = [row[0] for row in cursor.fetchall()] 
            
            last_min = sum(1 for t in timestamps if t > now - 60)
            last_hour = sum(1 for t in timestamps if t > now - 3600)
            last_day = len(timestamps)
            
            return last_min, last_hour, last_day

    # --- Power System ---

    def deduct_power(self, user_id, amount, reason="chat", model_id=None):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT power_balance, is_admin FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            if not user: return False
            
            if user['is_admin']: return True
                
            if user['power_balance'] < amount:
                return False
                
            new_balance = user['power_balance'] - amount
            
            cursor.execute("UPDATE users SET power_balance = ? WHERE id = ?", (new_balance, user_id))
            
            cursor.execute(
                "INSERT INTO power_ledger (user_id, change, balance_after, reason, model_id) VALUES (?, ?, ?, ?, ?)",
                (user_id, -amount, new_balance, reason, model_id)
            )
            conn.commit()
            return True

    def refund_power(self, user_id, amount, reason="refund"):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET power_balance = power_balance + ? WHERE id = ?", (amount, user_id))
            
            cursor.execute("SELECT power_balance FROM users WHERE id = ?", (user_id,))
            new_balance = cursor.fetchone()[0]
            
            cursor.execute(
                "INSERT INTO power_ledger (user_id, change, balance_after, reason) VALUES (?, ?, ?, ?)",
                (user_id, amount, new_balance, reason)
            )
            conn.commit()

    # --- Recharge System ---
    
    def create_recharge_codes(self, codes: List[Dict]):
        # codes = [{'code': 'ABC', 'value': 100}]
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.executemany(
                "INSERT INTO recharge_codes (code, value) VALUES (:code, :value)",
                codes
            )
            conn.commit()

    def redeem_code(self, user_id, code):
        """
        Returns (success, message, value)
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Check code
            cursor.execute("SELECT * FROM recharge_codes WHERE code = ? AND is_used = 0", (code,))
            record = cursor.fetchone()
            
            if not record:
                return False, "Invalid or used code", 0
                
            amount = record['value']
            
            # Mark used
            cursor.execute("UPDATE recharge_codes SET is_used = 1, used_by = ?, used_at = ? WHERE id = ?", 
                          (user_id, time.time(), record['id']))
            
            # Add Balance
            cursor.execute("UPDATE users SET power_balance = power_balance + ? WHERE id = ?", (amount, user_id))
            
            # Get New Balance
            cursor.execute("SELECT power_balance FROM users WHERE id = ?", (user_id,))
            new_balance = cursor.fetchone()[0]
            
            # Ledger
            cursor.execute(
                "INSERT INTO power_ledger (user_id, change, balance_after, reason, request_id) VALUES (?, ?, ?, ?, ?)",
                (user_id, amount, new_balance, 'recharge', code)
            )
            
            conn.commit()
            return True, "Success", amount

    def get_all_codes(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM recharge_codes ORDER BY created_at DESC")
            return [dict(r) for r in cursor.fetchall()]

    # --- Config System ---
    def get_config(self, key):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM system_config WHERE key = ?", (key,))
            row = cursor.fetchone()
            return row[0] if row else None

    def set_config(self, key, value):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)", (key, value))
            conn.commit()

    # --- Model Management ---

    def get_models(self, include_secrets=False):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ai_models WHERE enabled = 1")
            rows = [dict(r) for r in cursor.fetchall()]
            if not include_secrets:
                for r in rows:
                    del r['api_key']
                    del r['api_url']
            return rows

    def get_model_by_id(self, model_id):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ai_models WHERE id = ?", (model_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
            
    def update_model(self, model_id, updates: Dict[str, Any]):
        keys = list(updates.keys())
        values = list(updates.values())
        values.append(model_id)
        
        set_clause = ", ".join([f"{k} = ?" for k in keys])
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE ai_models SET {set_clause} WHERE id = ?", values)
            conn.commit()

    # --- User Data & Legacy ---
    def save_user_data(self, user_id, data_type, content):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            json_str = json.dumps(content)
            cursor.execute('''
                INSERT INTO user_data (user_id, data_type, json_content) 
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, data_type) 
                DO UPDATE SET json_content = excluded.json_content, updated_at = CURRENT_TIMESTAMP
            ''', (user_id, data_type, json_str))
            conn.commit()

    def get_user_data(self, user_id, data_type):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT json_content FROM user_data WHERE user_id = ? AND data_type = ?", (user_id, data_type))
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
            return None

    def get_all_users_full_data(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, username, password, email, is_admin, power_balance, ip_address FROM users")
            users = [dict(row) for row in cursor.fetchall()]
            
            for user in users:
                cursor.execute("SELECT data_type, json_content FROM user_data WHERE user_id = ?", (user['id'],))
                data_rows = cursor.fetchall()
                user['data'] = {row[0]: json.loads(row[1]) for row in data_rows}
                
            return users

db = Database()
