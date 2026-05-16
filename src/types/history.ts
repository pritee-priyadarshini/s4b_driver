export type OrderStatus =
  | 'Assigned'
  | 'Picked'
  | 'Delivered'
  | 'Cancelled';

export type HistoryOrderItem = {
  name: string;
  qty: number;
 };

export type HistoryOrder = {
  id: string;
  orderId: string;
  status: OrderStatus;
  assignedDate: string;
  assignedTime: string;
  deliveredDate: string;
  deliveredTime: string;
  restaurant: {
    name: string;
    address: string;
  };
  charity: {
    name: string;
    address: string;
  };
  items: HistoryOrderItem[];
  driverRating: number;
  restaurantRating: number;
};