import { View, Pressable, Image, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabRoute {
  key: string;
  name: string;
  params?: any;
}

interface TabState {
  index: number;
  routes: TabRoute[];
}

interface CustomTabBarProps {
  state: TabState;
  descriptors: any;
  navigation: any;
}

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 20;

  const currentOptions = descriptors[state.routes[state.index]?.key]?.options;
  if (currentOptions?.tabBarStyle?.display === "none") {
    return null;
  }

  return (
    <View 
      className="absolute left-4 right-4 flex-row bg-primary rounded-[36px] py-2.5 px-3 items-center justify-between shadow-lg"
      style={{ bottom: bottomOffset }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        let iconSource;
        if (route.name === "home") {
          iconSource = isFocused
            ? require("../../../assets/images/Trangchu.png")
            : require("../../../assets/images/Trangchu1.png");
        } else if (route.name === "ticket") {
          iconSource = isFocused
            ? require("../../../assets/images/Phieukham.png")
            : require("../../../assets/images/phieukham1.png");
        } else if (route.name === "scan") {
          iconSource = isFocused
            ? require("../../../assets/images/QR.png")
            : require("../../../assets/images/QR1.png");
        } else if (route.name === "navigation") {
          iconSource = isFocused
            ? require("../../../assets/images/DanDuong.png")
            : require("../../../assets/images/Danduong1.png");
        } else if (route.name === "profile") {
          iconSource = isFocused
            ? require("../../../assets/images/HoSo.png")
            : require("../../../assets/images/HoSo1.png");
        }

        if (isFocused) {
          return (
            <Pressable
              key={`${route.key}-active`}
              onPress={onPress}
              className="flex-row items-center bg-white rounded-full py-2 px-3.5 shadow-sm active:opacity-90"
            >
              <Image
                source={iconSource}
                className="w-[22px] h-[22px]"
                resizeMode="contain"
              />
              <Text className="text-primary text-[12px] font-bold ml-1.5">
                {typeof label === "string" ? label : route.name}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={`${route.key}-inactive`}
            onPress={onPress}
            className="flex-row items-center justify-center p-2.5 min-w-[44px] active:opacity-75"
          >
            <Image
              source={iconSource}
              className="w-[37px] h-[37px]"
              resizeMode="contain"
            />
          </Pressable>
        );
      })}
    </View>
  );
}
