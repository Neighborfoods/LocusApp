import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Colors } from "@theme/index";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
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
import TransferScreen from "@screens/community/TransferScreen";
import PropertyDetailScreen from "@screens/map/PropertyDetailScreen";
import EditProfileScreen from "@screens/profile/EditProfileScreen";
import NotificationsScreen from "@screens/profile/NotificationsScreen";
import SettingsScreen from "@screens/profile/SettingsScreen";
import ItemDetailScreen from "@screens/rentals/ItemDetailScreen";
import ItemRentalsScreen from "@screens/rentals/ItemRentalsScreen";
import CreateVoteScreen from "@screens/voting/CreateVoteScreen";
import VoteDetailScreen from "@screens/voting/VoteDetailScreen";
import VotingScreen from "@screens/voting/VotingScreen";

export type TabParams = {
  Home: undefined;
  Map: undefined;
  Communities: undefined;
  Finance: undefined;
  Profile: undefined;
};

export type AppStackParams = {
  Tabs: undefined;
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
  Transfer: { fromCommunityId: string };
  Notifications: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParams>();
const Stack = createNativeStackNavigator<AppStackParams>();

function TabBar({ state, descriptors, navigation }: any) {
  const tabs = [
    { name: "Home", icon: "home", activeIcon: "home", label: "Home" },
    { name: "Map", icon: "map-outline", activeIcon: "map", label: "Map" },
    {
      name: "Communities",
      icon: "home-group",
      activeIcon: "home-group",
      label: "Community",
    },
    {
      name: "Finance",
      icon: "chart-line",
      activeIcon: "chart-line",
      label: "Finance",
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
        const { options } = descriptors[route.key];
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
          <View key={route.key} style={styles.tabItem}>
            <Icon
              name={isFocused ? tab.activeIcon : tab.icon}
              size={24}
              color={isFocused ? Colors.primary : Colors.textSecondary}
              onPress={onPress}
            />
            {/* Dot indicator for active tab */}
            {isFocused && <View style={styles.activeDot} />}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.tabBar}>
      <View style={[StyleSheet.absoluteFill, styles.tabBarBg]} />
      {Inner}
    </View>
  );
}

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Communities" component={CommunitiesScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
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
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 84 : 64,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    overflow: "hidden",
  },
  tabBarBg: {
    backgroundColor: Colors.surface,
  },
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
    height: 50,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
});
