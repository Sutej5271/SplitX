# 💸 SmartSplit — Smart Group Expense Tracker

> **Split expenses. Simplify debts. Automate recurring payments.**

SmartSplit is a full-stack group expense management application inspired by platforms like Splitwise, but with a stronger focus on **debt simplification, automation, backend engineering, and algorithmic problem-solving**.

Instead of simply recording expenses, SmartSplit calculates users' net balances and uses a **graph-based greedy debt simplification algorithm** to reduce the number of transactions required to settle a group.

The project is designed as both a practical application and a learning project covering **React, Node.js, Express, PostgreSQL, REST APIs, JWT authentication, database design, algorithms, and system design**.

---

## 🚀 Why SmartSplit?

Traditional student expense-tracker projects usually stop at basic CRUD operations:

```text
Create Expense
       ↓
Store Expense
       ↓
Display Expense
```

SmartSplit goes further:

```text
Create Expense
       ↓
Calculate Individual Shares
       ↓
Calculate Net Balances
       ↓
Build Debt Relationships
       ↓
Simplify Transactions
       ↓
Generate Optimized Settlements
```

The main goal is to turn a simple expense tracker into a project that demonstrates **real backend logic and algorithmic thinking**.

---

# ✨ Features

## 👤 User Authentication

- User registration
- User login
- Secure password hashing
- JWT-based authentication
- Protected routes
- Authorization checks

---

## 👥 Group Management

Users can:

- Create groups
- View their groups
- Add members
- Remove members
- View group members
- Access group-specific expenses and settlements

Example:

```text
Hostel Group
├── User A
├── User B
├── User C
└── User D
```

---

## 💰 Expense Management

Users can create and manage group expenses.

Each expense contains information such as:

```text
Description
Amount
Paid By
Group
Date
Participants
```

Example:

```text
Expense: Dinner
Amount: ₹2,000
Paid By: User A

Split:
User A → ₹500
User B → ₹500
User C → ₹500
User D → ₹500
```

---

## ⚖️ Automatic Expense Splitting

SmartSplit automatically calculates how much each participant should contribute.

Different splitting strategies can be supported, such as:

- Equal split
- Custom amounts
- Individual shares

---

# 🧮 Debt Simplification Algorithm

This is the core feature that makes SmartSplit different from a basic CRUD project.

Imagine:

```text
A → +₹600
B → -₹300
C → -₹300
```

Instead of maintaining complicated individual debts, SmartSplit calculates the **net balance** of every user.

It then identifies:

```text
Creditors
    +
    
Debtors
```

and matches them to generate a smaller set of settlement transactions.

The simplified result becomes:

```text
B → A : ₹300
C → A : ₹300
```

---

## 🧠 How the Algorithm Works

### Step 1 — Calculate Net Balances

For every user:

```text
Net Balance =
Amount Paid
-
Amount They Owe
```

Example:

```text
A = +₹600
B = -₹300
C = -₹300
```

Positive balance:

```text
User should receive money
```

Negative balance:

```text
User needs to pay money
```

---

### Step 2 — Separate Creditors and Debtors

```text
Creditors

A → ₹600
```

```text
Debtors

B → ₹300
C → ₹300
```

---

### Step 3 — Match Debtors and Creditors

The algorithm matches the amount that can be transferred between them.

```text
B → A ₹300
```

Remaining:

```text
A → +₹300
C → -₹300
```

Then:

```text
C → A ₹300
```

Final result:

```text
B → A ₹300
C → A ₹300
```

---

## 📊 Algorithmic Concept

The settlement system uses a **greedy approach**.

At each step, it attempts to settle as much of a debtor's or creditor's balance as possible.

Concepts involved:

- Graph representation
- Net balance calculation
- Greedy algorithms
- Debt simplification
- Transaction minimization
- Time and space complexity

This provides an opportunity to discuss both **DSA and system design** during technical interviews.

---

# 🔁 Recurring Expenses

SmartSplit also supports recurring expenses such as:

```text
Monthly Rent
Internet
Netflix
Subscriptions
Electricity
Hostel Fees
```

Example:

```text
Rent
₹12,000
Frequency: Monthly
Next Due: 1st of every month
```

The application can automatically create the corresponding expense when it becomes due.

---

## ⚙️ Recurring Expense Flow

```text
Recurring Expense
        ↓
Scheduler checks due date
        ↓
Expense becomes due
        ↓
Create normal expense
        ↓
Create expense splits
        ↓
Calculate balances
        ↓
Update next due date
```

This demonstrates backend automation and scheduled jobs.

---

# 🏗️ System Architecture

```text
                    SMARTSPLIT
                         │
                         ▼
                ┌─────────────────┐
                │ React Frontend  │
                └────────┬────────┘
                         │
                    HTTP / JSON
                         │
                         ▼
                ┌─────────────────┐
                │ Node + Express  │
                │     Backend     │
                └────────┬────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        Business Logic          Authentication
              │                     │
              └──────────┬──────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   PostgreSQL    │
                │    Database     │
                └─────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

- React
- JavaScript
- HTML
- CSS
- React Router
- Fetch API

## Backend

- Node.js
- Express.js
- JavaScript
- REST APIs
- JWT
- bcrypt
- node-cron

## Database

- PostgreSQL
- SQL
- Relational database design

## Development Tools

- Git
- GitHub
- VS Code
- Postman
- npm

---

# 🗄️ Database Design

The application uses a relational PostgreSQL database.

Main entities include:

```text
users
groups
group_members
expenses
expense_splits
settlements
recurring_expenses
```

---

## Users

Stores application users.

```text
users
-------------------------
id
name
email
password
created_at
```

---

## Groups

Stores expense-sharing groups.

```text
groups
-------------------------
id
name
created_by
created_at
```

---

## Group Members

Connects users and groups.

```text
group_members
-------------------------
id
group_id
user_id
```

This represents a many-to-many relationship:

```text
User ←→ Group
```

---

## Expenses

Stores the main expense information.

```text
expenses
-------------------------
id
group_id
paid_by
description
amount
date
created_at
```

---

## Expense Splits

Stores how an expense is distributed among members.

```text
expense_splits
-------------------------
id
expense_id
user_id
amount
```

For example:

```text
Expense: ₹4,000

User A → ₹1,000
User B → ₹1,000
User C → ₹1,000
User D → ₹1,000
```

---

## Settlements

Stores completed or generated debt settlements.

```text
settlements
-------------------------
id
group_id
from_user
to_user
amount
status
created_at
```

---

## Recurring Expenses

Stores automatically repeating expenses.

```text
recurring_expenses
-------------------------
id
group_id
description
amount
paid_by
frequency
next_due_date
created_at
```

---

# 🔐 Authentication Flow

SmartSplit uses JWT-based authentication.

```text
                REGISTER
                   │
                   ▼
             Hash Password
                   │
                   ▼
              PostgreSQL
```

For login:

```text
Login
  │
  ▼
Find User
  │
  ▼
Compare Password
  │
  ▼
Generate JWT
  │
  ▼
Return Token
```

Protected request:

```text
React
  │
  │ JWT
  ▼
Express Middleware
  │
  ▼
Verify Token
  │
  ▼
Identify User
  │
  ▼
Controller
  │
  ▼
Database
```

---

# 📡 REST API Structure

The backend follows REST-style API design.

Example endpoints:

## Authentication

```http
POST /auth/register
POST /auth/login
```

## Groups

```http
GET    /groups
POST   /groups
GET    /groups/:groupId
POST   /groups/:groupId/members
DELETE /groups/:groupId/members/:userId
```

## Expenses

```http
GET    /groups/:groupId/expenses
POST   /groups/:groupId/expenses
PATCH  /expenses/:expenseId
DELETE /expenses/:expenseId
```

## Settlements

```http
GET  /groups/:groupId/settlements
POST /groups/:groupId/settlements
```

## Recurring Expenses

```http
GET   /groups/:groupId/recurring-expenses
POST  /groups/:groupId/recurring-expenses
PATCH /recurring-expenses/:id
DELETE /recurring-expenses/:id
```

> The exact API structure may evolve as the project develops.

---

# 📁 Project Structure

The project is organized into frontend and backend applications.

```text
SmartSplit/
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── ...
│
├── backend/
│   │
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── jobs/
│   ├── utils/
│   ├── db/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── README.md
└── .gitignore
```

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure the following are installed:

- Node.js
- npm
- PostgreSQL
- Git
- VS Code

---

# 1️⃣ Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Move into the project:

```bash
cd SmartSplit
```

---

# 2️⃣ Setup Backend

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

---

# 3️⃣ Configure Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartsplit
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
```

> Never commit your `.env` file to GitHub.

---

# 4️⃣ Create PostgreSQL Database

Open PostgreSQL and create:

```sql
CREATE DATABASE smartsplit;
```

Then create the required tables using the SQL schema provided in the project.

---

# 5️⃣ Start Backend

```bash
npm start
```

or:

```bash
node server.js
```

The backend should run at:

```text
http://localhost:5000
```

---

# 6️⃣ Setup Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will usually be available at:

```text
http://localhost:5173
```

---

# 🔑 Environment Variables

The project uses environment variables for configuration and security.

Example:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartsplit
DB_USER=postgres
DB_PASSWORD=********
JWT_SECRET=********
```

The `.env` file should be included in `.gitignore`.

---

# 🔒 Security Considerations

SmartSplit implements several basic security practices:

- Password hashing with bcrypt
- JWT authentication
- Protected API routes
- Authorization checks
- Parameterized SQL queries
- Environment variables for secrets
- Input validation
- Appropriate HTTP status codes

Sensitive information should never be hardcoded into the source code.

---

# 🧪 Testing

API testing can be performed using Postman.

Example workflow:

```text
Register
   ↓
Login
   ↓
Copy JWT
   ↓
Create Group
   ↓
Add Members
   ↓
Create Expense
   ↓
Check Balance
   ↓
Generate Settlements
```

Important scenarios to test:

- Invalid login
- Duplicate email
- Unauthorized access
- Invalid group ID
- Non-member attempting to add expense
- Negative expense amount
- Zero expense amount
- Invalid recurring expense
- Settlement calculations
- Multiple expenses
- Multiple debtors and creditors

---

# 📊 Example

Suppose four students share expenses:

```text
A paid ₹4,000
B paid ₹1,000
C paid ₹500
D paid ₹500
```

Total:

```text
₹6,000
```

Each person should contribute:

```text
₹6,000 / 4 = ₹1,500
```

Net balances:

```text
A → +₹2,500
B → -₹500
C → -₹1,000
D → -₹1,000
```

SmartSplit then generates simplified transactions to settle the balances.

The important part is that users don't have to manually calculate:

```text
Who owes whom?
How much?
Can some transactions be combined?
```

The application handles this automatically.

---

# 🧠 Important Concepts Learned

This project covers a wide range of software engineering concepts.

### Programming

- JavaScript
- Async programming
- Promises
- Error handling
- Modular code

### Frontend

- React components
- State management
- Forms
- Routing
- API integration
- Protected pages
- Reusable components

### Backend

- Node.js
- Express
- REST API design
- Middleware
- Controllers
- Services
- Authentication
- Authorization

### Database

- PostgreSQL
- SQL
- CRUD
- Primary keys
- Foreign keys
- Joins
- Relationships
- Constraints
- Transactions
- Query optimization

### Security

- Password hashing
- JWT
- Authorization
- SQL injection prevention
- Environment variables
- Input validation

### DSA

- Graphs
- Greedy algorithms
- Balance calculation
- Debt simplification
- Complexity analysis

### System Design

- Client-server architecture
- API design
- Database architecture
- Authentication flow
- Scheduled jobs
- Separation of concerns

---

# 📈 Future Improvements

Possible future features include:

- 📱 Mobile application
- 🔔 Notifications
- 📧 Email reminders
- 💳 Online payments
- 📊 Expense analytics
- 📈 Spending charts
- 🌙 Dark mode
- 🧾 Receipt image upload
- 🤖 AI-powered expense categorization
- 🔍 Advanced expense search
- 📤 Export expenses to CSV/PDF
- 👥 Friend system
- 🔗 Invite links
- 🔔 Settlement reminders
- 📅 Advanced recurring expense rules

---

# 🎯 Project Goals

The primary goals of SmartSplit are:

1. Build a complete full-stack application.
2. Understand frontend-backend communication.
3. Learn relational database design.
4. Implement secure authentication.
5. Practice REST API development.
6. Apply DSA to a real-world problem.
7. Understand backend automation.
8. Practice Git and GitHub workflows.
9. Learn debugging and error handling.
10. Build a project that can be discussed confidently in technical interviews.

---

# 💡 What Makes SmartSplit Different?

The goal isn't simply:

> "I built another Splitwise clone."

The goal is:

> **"I built a full-stack financial utility and solved the debt-settlement problem using an algorithmic approach."**

The project combines:

```text
Full Stack Development
        +
Database Engineering
        +
Authentication
        +
DSA
        +
Automation
        +
System Design
```

This makes the project useful not only as an application, but also as a practical demonstration of software engineering concepts.

---

# 🧑‍💻 Learning Journey

This project is being developed from scratch with an emphasis on **understanding the concepts behind the implementation**, rather than simply assembling pre-written code.

The development process focuses on:

```text
Understand
    ↓
Design
    ↓
Implement
    ↓
Test
    ↓
Debug
    ↓
Improve
```

Every major feature is intended to reinforce a software engineering concept.

---

# 📌 Current Status

🚧 **Project Status: Under Development**

### Completed / In Progress

- [x] Project planning
- [x] Backend setup
- [x] Express server
- [x] PostgreSQL integration
- [x] Database design
- [x] User authentication
- [x] JWT authentication
- [x] Group management
- [x] Expense management
- [x] Expense splitting
- [x] Debt settlement logic
- [x] Recurring expenses
- [x] Complete frontend polish
- [x] Advanced validation
- [x] Automated testing
- [x] Deployment
- [x] Production optimization

---

# 🛣️ Development Roadmap

```text
                 SmartSplit
                     │
                     ▼
            ┌─────────────────┐
            │ Project Planning│
            └────────┬────────┘
                     ▼
             Node + Express
                     │
                     ▼
                REST APIs
                     │
                     ▼
               PostgreSQL
                     │
                     ▼
              Authentication
                     │
                     ▼
              Group Management
                     │
                     ▼
              Expense Splitting
                     │
                     ▼
          Debt Simplification DSA
                     │
                     ▼
           Recurring Automation
                     │
                     ▼
                React UI
                     │
                     ▼
               Testing
                     │
                     ▼
               Deployment
```

---

# 📜 License

This project is developed for educational and portfolio purposes.

You may modify and extend the project for learning and experimentation.

---

# 👨‍💻 Author

**ManuTeja V**

B.Tech Computer Science Engineering

Interested in:

- Software Engineering
- Full-Stack Development
- Data Structures & Algorithms
- Backend Development
- System Design
- Building practical software projects

---

## ⭐ If you find this project useful

Consider giving the repository a ⭐ on GitHub.

Feedback, suggestions, and improvements are welcome.

---

> **SmartSplit — Because splitting expenses is easy. Settling them intelligently is the interesting part.**
