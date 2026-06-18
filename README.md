FinTrac is an AI-powered personal finance management platform designed to help users track expenses, monitor budgets, analyze spending habits, and make smarter financial decisions.

The platform provides real-time financial insights, automated expense categorization, subscription management, spending analytics, and intelligent recommendations to improve financial health.

🚀 Features
💰 Expense Tracking
Add, edit, and delete transactions
Categorize expenses and income
Real-time balance updates
Multi-category support
📊 Financial Analytics
Monthly spending reports
Income vs Expense visualization
Category-wise expense breakdown
Trend analysis and forecasting
🤖 AI Insights
Smart spending analysis
Personalized financial recommendations
Budget optimization suggestions
Financial health scoring
📅 Budget Management
Create custom budgets
Monthly spending limits
Budget progress tracking
Overspending alerts
🔔 Smart Notifications
Budget alerts
Bill reminders
Subscription renewal notifications
Financial goal updates
💳 Subscription Tracking
Monitor recurring payments
Subscription cost analysis
Renewal reminders
Unused subscription detection
🔐 Secure Authentication
Email & Password Authentication
Secure user sessions
Protected routes
User-specific data access
☁️ Cloud-Based Storage
Real-time synchronization
Secure database management
Cross-device accessibility
🛠 Tech Stack
Frontend
React.js
TypeScript
Tailwind CSS
Vite
Backend
Supabase
PostgreSQL
Edge Functions
Payments
Razorpay Integration
Authentication
Supabase Auth
Deployment
Vercel
Netlify
Lovable
📂 Project Structure
FinTrac/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── lib/
│   ├── context/
│   ├── utils/
│   └── assets/
│
├── supabase/
│   ├── functions/
│   └── migrations/
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
⚙️ Installation
Clone Repository
git clone https://github.com/yourusername/fintrac.git
cd fintrac
Install Dependencies
npm install
Configure Environment Variables

Create a .env file:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
Run Development Server
npm run dev
🗄 Database Setup
Create Tables
users
transactions
budgets
subscriptions
notifications
financial_goals

Run all Supabase migrations:

supabase db push
🔑 Authentication Flow
User Login/Register
        ↓
Supabase Auth
        ↓
JWT Session
        ↓
Protected Dashboard
        ↓
Financial Data Access
💳 Razorpay Integration
Create Order
const order = await fetch("/create-order", {
  method: "POST",
});
Verify Payment
const payment = new Razorpay(options);
payment.open();
📈 Future Roadmap
AI Financial Advisor
Bank Account Integration
Credit Score Monitoring
Investment Portfolio Tracking
Tax Planning Assistant
Multi-Currency Support
Voice-Based Expense Entry
OCR Receipt Scanning
🤝 Contributing
Fork the repository
Create a feature branch
git checkout -b feature/new-feature
Commit changes
git commit -m "Added new feature"
Push branch
git push origin feature/new-feature
Create Pull Request
🔒 Security
Encrypted Authentication
Secure API Endpoints
Row Level Security (RLS)
Protected User Data
Secure Payment Processing
📄 License

This project is licensed under the MIT License.

👨‍💻 Developer

Yashi Gupta

Portfolio: Add Your Portfolio Link
LinkedIn: Add Your LinkedIn Link
GitHub: Add Your GitHub Link
