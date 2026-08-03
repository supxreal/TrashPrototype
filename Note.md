# ♻️ EcoTrash (v2.0) - Project Summary & Usage Guide

EcoTrash is a web-based waste management and recycling reward system that connects **Users (Waste Sellers)** with **Buyers (Recycling Centers/Receivers)** to turn recyclable waste into reward points and cash value (`THB`).

---

## 🚀 How to Run the Project

1. **Option A: Direct File Opening (Easiest)**
   - Double-click or open [`index.html`](file:///Users/macsuphawit/Desktop/Trash%20test%20project/index.html) in any modern web browser.

2. **Option B: Local Web Server**
   - Open a terminal in the project root directory and run:
     ```bash
     python3 -m http.server 8000
     ```
   - Open your browser and navigate to `http://localhost:8000`.

---

## 👥 How to Use EcoTrash

### 1. Login & Role Selection ([`index.html`](file:///Users/macsuphawit/Desktop/Trash%20test%20project/index.html))
- Enter your **Username** (e.g. `Kla` or `EcoRecycler`).
- Select your role:
  - **♻️ User**: Throws/sells waste, scans QR codes, earns points & cash, and redeems rewards.
  - **🏪 Buyer**: Weighs waste, generates QR codes, and sets up buying locations.
- Click **Continue**.

---

### 2. User Portal ([`user.html`](file:///Users/macsuphawit/Desktop/Trash%20test%20project/user.html))

- **Balance & Points Dashboard**: Shows your accumulated reward points and cash balance (`฿ THB`).
- **Scan QR Code to Receive**:
  1. Click **Scan QR to Receive** to open the live camera scanner.
  2. Point your camera at the Buyer's generated QR code.
  3. Points and cash will automatically be added to your account upon scanning.
- **My Address & Home Pickup**:
  - Enter and save your home address so buyers can locate you for home pickup services.
  - Send pickup requests directly to buyers listed under **Find Buyers**.
- **Redeem Rewards**:
  - Redeem points for rewards like Free Coffee (500 Pts), Cloth Bag (1,200 Pts), 50฿ Coupon (2,000 Pts), or Movie Ticket (3,000 Pts).
- **My History**: Displays past waste transactions.

---

### 3. Buyer Portal ([`buyer.html`](file:///Users/macsuphawit/Desktop/Trash%20test%20project/buyer.html))

- **Store Settings**:
  - Set your buying location (e.g., "Building A, 1st Floor") and toggle **Home Pickup Service** availability. Click **Save Settings**.
- **New Transaction (Mix & Match)**:
  - Adjust quantity counters (`+` / `-` in kg) for waste categories:
    - 🔴 **Hazardous**: 100 Pts/kg | ฿10/kg
    - 🟡 **Recyclable**: 75 Pts/kg | ฿5/kg
    - 🟢 **Organic**: 50 Pts/kg | ฿2/kg
    - 🔵 **General**: 25 Pts/kg | ฿1/kg
  - Total Points and Total Value automatically calculate.
- **Generate QR Code**:
  - Click **Generate QR Code** to show the QR code modal on screen.
  - Ask the user to scan this QR code with their mobile device.
- **Recent Transactions**:
  - Automatically updates when a user scans the QR code, showing user details, item breakdown, and seller address.

---

## 📁 File Structure

```
├── index.html       # Login & Role Selection Page
├── user.html        # User Dashboard (Scanner, Rewards, History, Pickup)
├── buyer.html       # Buyer Dashboard (Calculator, QR Generation, Settings)
├── Note.md          # Project summary and usage guide
├── css/
│   └── style.css    # Custom Glassmorphism UI theme & transitions
└── js/
    ├── db.js        # EcoTrashDB class managing LocalStorage data & sessions
    ├── auth.js      # Form validation & smooth page navigation
    ├── user.js      # User scanning, balance updates, & reward redemption logic
    └── buyer.js     # Waste calculator & QR code generation logic
```

---

## 🛠️ Technology Stack

- **HTML5 / CSS3 / JavaScript (ES6)**
- **Tailwind CSS (via CDN)** for layout styling.
- **`html5-qrcode`** for live camera scanning on the User portal.
- **`qrcode.js`** for client-side QR code rendering on the Buyer portal.
- **`localStorage`** (`EcoTrashDB`) for client-side database persistence.
