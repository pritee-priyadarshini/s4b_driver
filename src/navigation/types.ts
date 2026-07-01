import { NavigatorScreenParams } from '@react-navigation/native';
import { HistoryOrder } from '../types/history';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;

  OrderDetails: {
    order: HistoryOrder;
  };

  ChangePassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  History: undefined;
  Profile: undefined;
};