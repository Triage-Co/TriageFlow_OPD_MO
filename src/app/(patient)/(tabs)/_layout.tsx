import { Tabs } from "expo-router";
import CustomTabBar from "@/shared/components/CustomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Trang chủ",
        }}
      />
      <Tabs.Screen
        name="ticket"
        options={{
          title: "Phiếu khám",
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Quét mã",
        }}
      />
      <Tabs.Screen
        name="navigation"
        options={{
          title: "Dẫn đường",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
        }}
      />
    </Tabs>
  );
}
