export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PORTFOLIO: '/portfolio',
  STOCKS: '/stocks',
  TRANSACTIONS: '/transactions',
  FRIENDS: '/friends',
  DEPOSIT: '/deposit',
  WITHDRAW: '/withdraw',
  TRANSFER: '/transfer',
  CREATE_PORTFOLIO: '/create_portfolio',
  CREATE_STOCK_LIST: '/create_stock_list',
  STOCK_LISTS: '/stock_lists',
  ADD_DAILY_STOCK: '/add_daily_stock',
  CHART: '/chart',
};

export const NAV_ITEMS = [
  { label: 'Portfolio', path: ROUTES.PORTFOLIO },
  { label: 'Orders', path: ROUTES.TRANSACTIONS },
  { label: 'Create Portfolio', path: ROUTES.CREATE_PORTFOLIO },
  { label: 'Stocks', path: ROUTES.STOCKS },
  { label: 'Friends', path: ROUTES.FRIENDS },
  { label: 'Create stocklist', path: ROUTES.CREATE_STOCK_LIST },
  { label: 'Stocklists', path: ROUTES.STOCK_LISTS },
  { label: 'Add daily stock', path: ROUTES.ADD_DAILY_STOCK },
];
