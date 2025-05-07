StockPrediction - Social Network for Stocks
A full‑stack stock‑portfolio management and social‑networking platform that lets users analyze, predict, and share stock performance — built by students with a passion for stocks and cryptocurrency.

This app combines PostgreSQL, Next.js, React, and advanced SQL to deliver seamless stock‑tracking and prediction plus social features like sharing stock lists and writing reviews.

Features
User Management
Secure registration and login

Each new user automatically receives a base portfolio

Portfolios
Manage multiple portfolios

Deposit, withdraw, buy, sell, and transfer stocks or cash

Track total value and historical performance

Interactive charts for portfolio growth

Stocks
Buy and sell individual stocks

Add new daily price data and see real‑time portfolio updates

Price‑history charts (1 W, 1 M, 3 M, 1 Y, 5 Y)

Linear‑regression price predictions for the same ranges

Stock Lists
Create public, private, or shared lists

Share lists with friends and request reviews

Browse public lists with community reviews

Social Networking
Send & accept friend requests (mutual friendships)

View and manage friends

Share stock lists for collaborative analysis

Reviews
Add, edit, and delete reviews on stock lists

Visibility levels: private, shared, public

Performance Analysis & Prediction
Metrics: Coefficient of Variation (COV), Beta, Covariance & Correlation matrices

Predict prices with linear regression

Compare predicted vs. historical prices in charts

Optimizations
SQL caching layer for heavy statistics queries

Views & triggers to merge historical and new stock data for live updates

Fully normalized schema (BCNF / 3 NF) for efficiency

Technologies Used
Layer	Tech
Database	PostgreSQL (views, triggers, caching)
Backend	Next.js API routes
Frontend	React 18
Charts	Chart.js / react‑chartjs‑2
Styling	Vanilla CSS & inline styles
Hosting	Cloud VM (PostgreSQL + Next.js server)

Installation & Setup
Requirements
Node.js

PostgreSQL

1 — Clone the repo
bash
Copy
Edit
git clone https://github.com/HamedDawoudzai/stockprediction.git
cd stockprediction
2 — Install dependencies
bash
Copy
Edit
npm install
3 — Configure environment
Set up your PostgreSQL server.

Update the connection string (user myuser, password abc123, VM IP) in /pages/api/* files or in .env.local.

4 — Run the dev server
bash
Copy
Edit
npm run dev
Open http://localhost:3000 in your browser.

📊 Dataset
The app ships with 5 years of daily S&P 500 data and lets users upload additional daily prices.
All data is unified in SQL views.

Fields

Column	Description
Symbol	Ticker symbol
Timestamp	Trading day
Open / High / Low / Close	OHLC prices
Volume	Shares traded

📈 Prediction Model
A simple linear‑regression model forecasts closing prices from historical data.
While not intended for professional trading, it demonstrates integrating predictive analytics into a relational app.

📡 Social Interaction
Friend management (requests, acceptance, removal)

Share stock lists privately or publicly

Write and read reviews on shared/public lists

Assumptions
Friendships are mutual

Stock lists default to private or public, then can be shared individually

Users add price data for existing tickers, not brand‑new tickers

Every user starts with one default portfolio

Supported transactions: deposit, withdraw, buy, sell, transfer

License
This project is for academic purposes only — none of the code or content constitutes investment advice.
Feel free to fork or reach out if you’d like to build upon it.

Contact
Developed by Hamed Dawoudzai
📧 hamed.dawoudzai@gmail.com
