# StockPrediction - Social Network for Stocks

A full‑stack stock‑portfolio management and social‑networking platform that lets users analyze, predict, and share stock performance — built by students with a passion for stocks and cryptocurrency.  

The application combines **PostgreSQL**, **Next.js**, **React**, and advanced SQL to deliver seamless stock‑tracking and prediction along with social features such as sharing stock lists and writing reviews.

---

### User Management
- Secure registration and login.  
- Each new user automatically receives a base portfolio.

### Portfolios
- Manage multiple portfolios.  
- Deposit, withdraw, buy, sell, and transfer stocks or cash.  
- Track total value and historical performance.  
- Interactive charts for portfolio growth.

### Stocks
- Buy and sell individual stocks.  
- Add new daily price data and see real‑time portfolio updates.  
- Outputted graphs representing historical prices of stocks for the following time frames, as well predicted future stock prices for the following time frames (1 W, 1 M, 3 M, 1 Y, 5 Y).  
- Linear‑regression price predictions for the same ranges.

### Stock Lists
- Create public, private, or shared lists.  
- Share lists with friends and request reviews.  
- Browse public lists with community feedback.

### Social Networking
- Send and accept friend requests (mutual friendships).  
- View and manage friends.  
- Share stock lists for collaborative analysis.

### Reviews
- Add, edit, and delete reviews on stock lists.  
- Visibility levels: private, shared, or public.

### Performance Analysis & Prediction
- Metrics: Coefficient of Variation (COV), Beta, Covariance & Correlation matrices.  
- Predict prices with linear regression.  
- Compare predicted vs. historical prices in charts.

### Optimizations
- SQL caching layer for compute‑heavy statistics.  
- Views and triggers that merge historical and new stock data for live updates.  
- Fully normalized schema (BCNF / 3 NF) for efficiency.

###Screenshots

##Welcome
<img width="1470" alt="start_page" src="https://github.com/user-attachments/assets/6c8fd76e-b27b-43e6-b91b-eb33b1aa30cb" />

<img width="1470" alt="login" src="https://github.com/user-attachments/assets/6218bfe4-63b7-402f-aa9e-8ae54c5e7ab0" />

<img width="1470" alt="signup" src="https://github.com/user-attachments/assets/2f2e7c57-2cfc-4c10-98fc-b2918efc4ab0" />

##Portfolio Operations

<img width="1470" alt="portfolio" src="https://github.com/user-attachments/assets/ca3a2e5a-ef0b-41de-9bcc-0c4c5769c9dd" />

<img width="1470" alt="deposit" src="https://github.com/user-attachments/assets/af3ae566-5b04-4730-a224-92e7baba6d60" />

<img width="1470" alt="withdraw" src="https://github.com/user-attachments/assets/8af95534-2f1f-498a-9056-023b9b0e362b" />

<img width="1470" alt="transfer" src="https://github.com/user-attachments/assets/6199a00e-9bbd-49d6-b520-d25580a7c2ab" />

<img width="1470" alt="create_portfolio" src="https://github.com/user-attachments/assets/0775abf2-f036-4b88-955a-b93575cc20db" />


##Graph

<img width="1470" alt="historical_data" src="https://github.com/user-attachments/assets/90a597ca-9a9e-4d83-9559-e305a42ea2b2" />


<img width="1470" alt="price_prediction" src="https://github.com/user-attachments/assets/5e73d684-9359-4796-8bea-0caf044c48de" />

##Stock

<img width="1463" alt="buying_stock" src="https://github.com/user-attachments/assets/9ab53de7-6455-4d58-ac8b-59d887a0d6a5" />

<img width="1470" alt="transactions" src="https://github.com/user-attachments/assets/47b40f44-1e73-45e1-bbf7-c1f3e71dad82" />

<img width="1470" alt="add_daily_stock" src="https://github.com/user-attachments/assets/7a58efc4-da7d-495c-b150-48e328680493" />

##Social Network and Stock Lists

<img width="1470" alt="stock_lists" src="https://github.com/user-attachments/assets/45b76a6e-0e7d-44f9-9036-4d97abdbfaa4" />

<img width="1470" alt="create_stock_list" src="https://github.com/user-attachments/assets/7ed8ca46-5f01-464e-ac2b-12cef57dfbcf" />

<img width="1469" alt="friends" src="https://github.com/user-attachments/assets/5f9a675c-88ea-465c-9a64-116f6b53206f" />

### Technologies Used
- **Database:** PostgreSQL (views, triggers, caching)  
- **Backend:** Next.js API routes  
- **Frontend:** React 18  
- **Charts:** Chart.js / react‑chartjs‑2  
- **Styling:** Vanilla CSS & inline styles  
- **Hosting:** Cloud VM (PostgreSQL + Next.js server)

---

### Requirements
- Node.js  
- PostgreSQL

### Installation
1. **Clone the repository**
   git clone https://github.com/HamedDawoudzai/stockprediction.git
   cd stockprediction
2. **Install Dependencies**
   npm install
3. **Configure Environment**
   Create a .env.local file in the project root with DATABASE_URL=postgresql://myuser:abc123@<VM_IP>:5432/<database_name>(connecting to the VM)
4. **Run the development server**
  npm run dev
5. Open http://localhost:3000 in your browser.

### Dataset
The application includes five years of daily S&P 500 data and allows users to upload additional daily prices. All records are unified through SQL views.

### Contact
Developed by Hamed Dawoudzai

Email: hamed.dawoudzai@gmail.com
