import Timer from "@/components/Timer";
import Weather from "@/components/weather";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Device from "expo-device";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import {
  ArrowDownUp,
  Check,
  EllipsisVertical,
  HelpCircle,
  Home,
  Map,
  RefreshCw,
  User,
  X,
} from "lucide-react-native";
import React, { JSX, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { vexo } from "vexo-analytics";
import Clock from "../components/Clock";
import Gpskoords from "../components/Gpskoords";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../lib/supabase";
import { loadLanguage } from "./i18n";
import "./i18n.js";
import MapScreen from "./mapscreen";
import Profilescreen from "./profilescreen";

const vexoCode = process.env.EXPO_PUBLIC_VEXO_KEY!;

vexo(vexoCode);

const componentMap: Record<string, JSX.Element> = {
  "1": <Clock />,
  "2": <Weather />,
  "3": <Gpskoords />,
  "4": <Timer />,
};

const initialOrder = ["1", "2", "3", "4"];

interface RenderItemProps {
  item: any;
  drag: () => void;
  isActive: boolean;
}

function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [dragEnabled, setDragEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [Admin, setAdmin] = useState(false);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const toggleDrag = () => setDragEnabled((prev) => !prev);

  async function loadOrder() {
    if (!user) return;
    const { data: orderData } = await supabase
      .from("component_orders")
      .select("component_order")
      .eq("user_id", user.id)
      .single();
    if (orderData && orderData.component_order) {
      setOrder(orderData.component_order);
    }
    setLoadingOrder(false);
  }

  useEffect(() => {
    loadOrder();
    setLoading(false);
  }, [user]);

  const saveOrder = async (newOrder: string[]) => {
    if (!user) return;
    await supabase.from("component_orders").upsert(
      [
        {
          user_id: user.id,
          component_order: newOrder,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id" }
    );
  };

  const startWatching = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location authorization denied");
        return;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (loc) => {
          setLocation(loc);
          setErrorMsg(null);
        }
      );

      setSubscription(sub);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const Startdragging = () => {
    setModalVisible(false);
    toggleDrag();
  };

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const stopWatching = () => {
    subscription?.remove();
    setSubscription(null);
  };

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);
  // Splash screen adden
  if (loading || loadingOrder) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#466483ff" />
      </View>
    );
  }

  if (Admin) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#000" }}>
          Admin Panel Entwicklungsversion
        </Text>
        <Text style={{ color: "#000" }}>Benachrichtigungen aktiv.</Text>
      </View>
    );
  } else {
    return (
      <GestureHandlerRootView>
        <View style={styles.header}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.image}
          />
          {dragEnabled ? (
            <TouchableOpacity
              style={styles.more}
              onPress={() => setDragEnabled(false)}
            >
              <Check strokeWidth={3} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.more}
              onPress={() => setModalVisible(true)}
            >
              <EllipsisVertical strokeWidth={2} size={30} />
            </TouchableOpacity>
          )}
        </View>
        <View style={{ paddingVertical: 12 }} />
        <View>
          <Render
            order={order}
            setOrder={setOrder}
            dragEnabled={dragEnabled}
            onOrderChange={saveOrder}
          />
        </View>
        {modalVisible && (
          <View style={styles.customModal}>
            <>
              <View style={styles.modalContent}>
                <View style={styles.close}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <X strokeWidth={3} />
                  </TouchableOpacity>
                </View>
                <View style={{ paddingTop: 20 }}>
                  <TouchableOpacity
                    onPress={Startdragging}
                    style={styles.button}
                  >
                    <ArrowDownUp />
                    <Text style={styles.text}> Drag Elements</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={loadOrder} style={styles.button}>
                    <RefreshCw />
                    <Text style={styles.text}> Reload </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          </View>
        )}
      </GestureHandlerRootView>
    );
  }
}

export function Render({
  order,
  setOrder,
  dragEnabled,
  onOrderChange,
}: {
  order: string[];
  setOrder: (o: string[]) => void;
  dragEnabled?: boolean;
  onOrderChange: (o: string[]) => void;
}) {
  const data = order.map((key) => ({
    key,
    component: componentMap[key],
  }));
  const renderItem = ({ item, drag, isActive }: RenderItemProps) => (
    <View
      style={{
        backgroundColor: isActive ? "transparent" : "transparent",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "transparent",
        margin: 4,
      }}
    >
      {dragEnabled ? (
        <TouchableOpacity onLongPress={drag}>
          <Text>{item.component}</Text>
        </TouchableOpacity>
      ) : (
        <Text>{item.component}</Text>
      )}
    </View>
  );

  return (
    <DraggableFlatList
      data={data}
      onDragEnd={({ data }) => {
        const newOrder = data.map((item) => item.key);
        setOrder(newOrder);
        onOrderChange(newOrder);
      }}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      activationDistance={dragEnabled ? 1 : 9999}
      scrollEnabled={dragEnabled}
    />
  );
}

const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function App() {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  useEffect(() => {
    loadLanguage();
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync();
    const unsubscribe = subscribeToNewRequests();

    return () => {
      unsubscribe();
    };
  }, []);

  const subscribeToNewRequests = () => {
    console.log("checking");

    const channel = supabase
      .channel("delete-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "delete_requests" },
        async (payload: any) => {
          console.log("Neuer Antrag:", payload.new);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Neuer Löschantrag",
              body: `Von ${payload.new.email}`,
              sound: "default",
            },
            trigger: null,
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Benachrichtigungen sind deaktiviert 😕");
        return;
      }
    } else {
    }
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: scheme === "dark" ? "#2c2a28ff" : "#e2d7d7ff",
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let IconComponent;

          switch (route.name) {
            case "Home":
              IconComponent = Home;
              break;
            case "Map":
              IconComponent = Map;
              break;
            case "Profile":
              IconComponent = User;
              break;
            default:
              IconComponent = HelpCircle;
              break;
          }

          return <IconComponent size={size} color={color} />;
        },
        tabBarActiveTintColor: "#466483ff",
      })}
    >
      <Tab.Screen
        name="Home"
        options={{ tabBarLabel: t("Home"), headerShown: false }}
        component={HomeScreen}
      />
      <Tab.Screen
        name="Map"
        options={{ tabBarLabel: t("map"), headerShown: false }}
        component={MapScreen}
      />
      <Tab.Screen
        name="Profile"
        options={{ tabBarLabel: t("profile"), headerShown: false }}
        component={Profilescreen}
      />
    </Tab.Navigator>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    header: {
      backgroundColor: "#fff",
      borderBottomColor: "#fff",
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      elevation: 2,
    },
    image: {
      width: 170,
      height: 60,
      marginTop: 40,
      marginBottom: 15,
    },
    more: {
      marginLeft: 160,
      marginTop: 20,
    },
    modalContent: {
      padding: 20,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      alignItems: "center",
      minHeight: 200,
    },
    customModal: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#fff",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    closeButton: {
      padding: 7,
      width: 25,
      height: 25,
      borderRadius: 35,
      backgroundColor: "rgba(91, 92, 92, 0.4)",
      justifyContent: "center",
      alignItems: "center",
    },
    close: {
      alignSelf: "flex-end",
    },
    button: {
      flexDirection: "row",
      paddingVertical: 12,
      alignSelf: "flex-start",
    },
    text: {
      fontSize: 18,
      fontWeight: "500",
      paddingLeft: 20,
    },
  });

export default App;
