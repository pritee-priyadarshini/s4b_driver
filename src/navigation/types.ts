import { HistoryOrder } from "../types/history";

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;

  PickupConfirm: {
    pickup: any;
    onConfirm?: (id: string) => void;
  };

  OrderDetails: {
    order: HistoryOrder;
  };
  
  ChangePassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Route: undefined;
  History: undefined;
  Profile: undefined;
};