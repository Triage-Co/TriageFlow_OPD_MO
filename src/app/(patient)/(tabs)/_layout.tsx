import { Tabs } from "expo-router";
import { Text, View } from "react-native";

type TabIconProps = {
  focused: boolean;
  emoji: string;
};

function TabIcon({ focused, emoji }: TabIconProps) {
  return (
    <View className={`items-center justify-center ${focused ? "opacity-100" : "opacity-50"}`}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#5B9BD5",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🏠" />
          ),
        }}
      />
      <Tabs.Screen
        name="ticket"
        options={{
          title: "Phiếu khám",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🎟️" />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Quét mã",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="📷" />
          ),
        }}
      />
      <Tabs.Screen
        name="navigation"
        options={{
          title: "Dẫn đường",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🗺️" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="👤" />
          ),
        }}
      />
    </Tabs>
  );
}
