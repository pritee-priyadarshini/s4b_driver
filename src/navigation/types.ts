import { NavigatorScreenParams } from '@react-navigation/native';
import { HistoryOrder } from '../types/history';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
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