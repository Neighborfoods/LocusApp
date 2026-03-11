import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@theme/useTheme";
import React from "react";
import { Platform, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Tab Screens
import CommunitiesScreen from "@screens/community/CommunitiesScreen";
import FinanceScreen from "@screens/finance/FinanceScreen";
import HomeScreen from "@screens/home/HomeScreen";
import MapScreen from "@screens/map/MapScreen";
import ProfileScreen from "@screens/profile/ProfileScreen";

// Stack Screens
import CommunityDetailScreen from "@screens/community/CommunityDetailScreen";
import CommunityMembersScreen from "@screens/community/CommunityMembersScreen";
import ApplyCommunityScreen from "@screens/community/ApplyCommunityScreen";
import CreateCommunityScreen from "@screens/community/CreateCommunityScreen";
import TransferScreen from "@screens/finance/TransferScreen";
import SavingsScreen from "@screens/finance/SavingsScreen";
import PropertyDetailScreen from "@screens/map/PropertyDetailScreen";
import EditProfileScreen from "@screens/profile/EditProfileScreen";
import NotificationsScreen from "@screens/profile/NotificationsScreen";
import SettingsScreen from "@screens/profile/SettingsScreen";
import ItemDetailScreen from "@screens/rentals/ItemDetailScreen";
import ItemRentalsScreen from "@screens/rentals/ItemRentalsScreen";
import CreateVoteScreen from "@screens/voting/CreateVoteScreen";
import VoteDetailScreen from "@screens/voting/VoteDetailScreen";
import VotingScreen from "@screens/voting/VotingScreen";
import AddPropertyScreen from "@screens/property/AddPropertyScreen";
import ComingSoonScreen from "@screens/stub/ComingSoonScreen";

export type TabParams = {
  Home: undefined;
  Map: undefined;
  Communities: { autoFocusSearch?: boolean } | undefined;
  Finance: undefined;
  Profile: undefined;
};

export type AppStackParams = {
  Tabs: { screen?: string; params?: { autoFocusSearch?: boolean } } | undefined;
  CommunityDetail: { communityId: string };
  CreateCommunity: undefined;
  ApplyCommunity: { communityId: string };
  CommunityMembers: { communityId: string };
  PropertyDetail: { propertyId: string };
  Voting: { communityId: string };
  VoteDetail: { voteId: string; communityId: string };
  CreateVote: { communityId: string };
  ItemRentals: { communityId: string };
  ItemDetail: { itemId: string; communityId: string };
  Transfer: { fromCommunityId?: string };
  Savings: undefined;
  Notifications: undefined;
  EditProfile: undefined;
  Settings: undefined;
  AddProperty: undefined;
  TransactionHistory: undefined;
  HelpFAQ: undefined;
  ReportIssue: undefined;
  AboutLocus: undefined;
  MyRentals: undefined;
  TransferCommunity: undefined;
};

const Tab = createBottomTabNavigator<TabParams>();
const Stack = createNativeStackNavigator<AppStackParams>();

function TabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();
  const tabs = [
    { name: "Home", icon: "home-outline", activeIcon: "home", label: "Home" },
    { name: "Map", icon: "map-outline", activeIcon: "map", label: "Explore" },
    {
      name: "Communities",
      icon: "account-group-outline",
      activeIcon: "account-group",
      label: "Communities",
    },
    {
      name: "Finance",
      icon: "chart-line",
      activeIcon: "chart-line",
      label: "Insights",
    },
    {
      name: "Profile",
      icon: "account-outline",
      activeIcon: "account",
      label: "Profile",
    },
  ];

  const Inner = (
    <View style={styles.tabInner}>
      {state.routes.map((route: any, index: number) => {
        const { options: _options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = tabs[index];

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Icon
              name={isFocused ? tab.activeIcon : tab.icon}
              size={24}
              color={isFocused ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? colors.primary : colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.tabBar, { borderTopColor: colors.tabBarBorder }]}>
      <View style={[StyleSheet.absoluteFill, styles.tabBarBg, { backgroundColor: colors.tabBar }]} />
      {Inner}
    </View>
  );
}

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, lazy: true }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Communities" component={CommunitiesScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function StackNavigatorInner() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Tabs" component={BottomTabNavigator} />
      <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
      <Stack.Screen
        name="CreateCommunity"
        component={CreateCommunityScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="ApplyCommunity"
        component={ApplyCommunityScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="CommunityMembers"
        component={CommunityMembersScreen}
      />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen name="Voting" component={VotingScreen} />
      <Stack.Screen name="VoteDetail" component={VoteDetailScreen} />
      <Stack.Screen
        name="CreateVote"
        component={CreateVoteScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="ItemRentals" component={ItemRentalsScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Savings" component={SavingsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AddProperty" component={AddPropertyScreen} options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="TransactionHistory" component={ComingSoonScreen} />
      <Stack.Screen name="HelpFAQ" component={ComingSoonScreen} />
      <Stack.Screen name="ReportIssue" component={ComingSoonScreen} />
      <Stack.Screen name="AboutLocus" component={ComingSoonScreen} />
      <Stack.Screen name="MyRentals" component={ComingSoonScreen} />
      <Stack.Screen name="TransferCommunity" component={ComingSoonScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return <StackNavigatorInner />;
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 84 : 64,
    borderTopWidth: 1,
    overflow: "hidden",
  },
  tabBarBg: {},
  tabInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
});
