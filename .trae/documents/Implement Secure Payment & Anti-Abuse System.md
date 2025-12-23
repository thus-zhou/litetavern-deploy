I will implement a **Secure "Recharge Code" (CD-Key) System** to handle payments safely and flexibly.

### 🛡️ Security & Anti-Abuse Strategy
1.  **Decoupled Payments (Maximum Safety)**:
    *   The system will **not** directly bind bank cards. Instead, it uses **Recharge Codes**.
    *   **Admin Control**: You generate codes (e.g., `LT-8888-....`) in the background.
    *   **Flexible Channels**: You can sell these codes via **any channel** (Alipay, WeChat, Idle Fish, automatic card selling sites). You just paste the "Purchase Link" or "Payment Instructions" in the app's announcement area.
    *   *Benefit*: No need to apply for complex merchant APIs, and hackers cannot exploit payment gateways since they don't exist in the code.

2.  **Anti-Malicious Registration**:
    *   **Panic Button**: I will add a **"Toggle Registration"** switch in the Admin Dashboard. If you detect an attack, you can instantly shut down new registrations.
    *   **Strict IP Limits**: Maintain the current "1 IP = 1 Account" rule, but I will harden the validation.
    *   **Email Verification**: Forced email verification ensures bots cannot easily mass-register without valid mailboxes.

### 🏗️ Implementation Plan

#### 1. Backend (Python)
*   **Database**:
    *   New `recharge_codes` table: Stores generated keys and their values.
    *   New `system_config` table: Stores global configs like "Shop Announcement" and "Registration Open/Close".
*   **API (`/api/shop`)**:
    *   `POST /redeem`: Users input code -> Get Power (Rate limited to prevent guessing).
    *   `POST /admin/generate`: Admin creates batch codes.
    *   `POST /admin/config`: Admin updates shop text (e.g., "Alipay: 138xxxx...").

#### 2. Frontend (React/TS)
*   **Wallet / Shop Interface**:
    *   A new **"Wallet"** button in the sidebar.
    *   **User View**: Shows current balance, transaction history, and the **"Recharge Method"** (text/link set by you). Input box for CD-Key.
    *   **Admin View**: A "Shop Manager" tab to generate codes and set the announcement text.
*   **Localization**:
    *   All new interfaces will be strictly in **Simplified Chinese**.

#### 3. Execution Steps
1.  Update Database schema.
2.  Implement `shop.py` backend logic.
3.  Create frontend `WalletModal` and update `AdminDashboard`.
4.  Verify security limits (Anti-Brute Force on codes).

This solution gives you **total control** over money (you receive it externally) and **total control** over security (you issue the power).
