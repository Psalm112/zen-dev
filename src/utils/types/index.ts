export type NotificationType = 'update' | 'funds' | 'buyer' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  timestamp: Date;
  icon?: string; 
  link?: string; 
}

export type TabType = "1" | "2" | "3" | "4";
export type TradeTab = "buy" | "sell" | "active" | "completed";

export interface TabOption {
  id: TabType;
  label: string;
}

export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  options: TabOption[];
}


export interface Product {
  id: string;
  name: string;
  image: string;
  price: string;
  quantity: string;
  minCost: string;
  description: string;
  orders: number;
  rating: number;
  seller: string;
  status?: string;
  timeRemaining?: string;
  escrowStatus?: string;
  paymentStatus?: string;
  paymentDuration? : string
}

export interface ReferralItem {
  id: string;
  name: string;
  action?: "from" | "to";
  type: string;
  points: number;
  date: string;
  status?: string;
}

export interface ReferralHistoryProps {
  history: ReferralItem[];
  onInviteFriends: () => void;
}

export interface ReferralData extends Omit<ReferralHistoryProps, "onInviteFriends"> {
  activePoints: number;
  usedPoints: number,
  promoCode: string
}






export type TradeStatusType = "cancelled" | "pending" | "release" | "completed";

export interface TradeOrderDetails {
  productName: string;
  amount: string;
  quantity: number;
  orderTime: string;
  orderNo: string;
  paymentMethod?: string;
  tradeType: "BUY" | "SELL";
}

export interface TradeTransactionInfo {
  buyerName: string;
  goodRating: number;
  completedOrders: number;
  completionRate: number;
  avgPaymentTime: number;
}

export interface TradeStatusProps {
  status: TradeStatusType;
  orderDetails: TradeOrderDetails;
  transactionInfo: TradeTransactionInfo;
  onContactSeller?: () => void;
  onContactBuyer?: () => void;
  onOrderDispute?: () => void;
  onReleaseNow?: () => void;
}