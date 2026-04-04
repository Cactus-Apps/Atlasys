// Version 1.3.6 - © Cactus Apps 2026
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import {
  ArrowDownUp,
  Check,
  EllipsisVertical,
  RefreshCw,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAppTheme } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { loadLanguage } from "../i18n";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import {
  registerForPushNotificationsAsync,
  subscribeToNewRequests,
} from "@/utils/notificationConfig";
import { supabase } from "@/lib/auth/supabase";
import Clock from "@/components/HomeScreenComponents/Clock";
import Gpskoords from "@/components/HomeScreenComponents/Gpskoords";
import Timer from "@/components/HomeScreenComponents/Timer";
import Weather from "@/components/weather";
import { JSX } from "react";
import DraggableFlatList from "react-native-draggable-flatlist";
import { useloadingStore } from "@/lib/storage/zustand";

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

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const loadingAll = useloadingStore((s) => s.loadingAll);
  const setloadingGpsCoords = useloadingStore((s) => s.setloadingGpsCoords);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState<string>("");
  const loadingGpsCoords = useloadingStore((s) => s.loadingGpsCoords);
  const loadingWeather = useloadingStore((s) => s.loadingWeather);
  const [Admin, setAdmin] = useState(false);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [time, setTime] = useState(new Date());
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const toggleDrag = () => setDragEnabled((prev) => !prev);

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
      { onConflict: "user_id" },
    );
    setLoading(false);
  };

  const askLocationPermission = async () => {
     const {status} = await Location.requestForegroundPermissionsAsync();
     setStatus(status);
     console.error(status)
  };


  const startWatching = async () => {
    try {
      if (status !== "granted") {
        setErrorMsg(t("Location_authorization_denied"));
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
        },
      );

      setSubscription(sub);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setloadingGpsCoords(false);
    }
  };

  const stopWatching = () => {
    subscription?.remove();
    setSubscription(null);
  };

  useEffect(() => {
    loadOrder();
    setLoading(false);
  }, [user]);

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  if (Admin) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#000" }}>
          Admin Panel Development Version
        </Text>
        <Text style={{ color: "#000" }}>Notifications active.</Text>
        <TouchableOpacity onPress={() => router.navigate("/_sitemap")}>
          <Text style={{ color: "#000" }}> navigate </Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    return (
        <AuthProvider>
          <GestureHandlerRootView style={{flex: 1}}>
            <View style={styles.header}>
              <TouchableOpacity onPress={askLocationPermission}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.image}
              />
              </TouchableOpacity>
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
                        <Text style={styles.text}>{t("Drag_Elements")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={loadOrder}
                        style={styles.button}
                      >
                        <RefreshCw />
                        <Text style={styles.text}>{t("Reload")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              </View>
            )}
          </GestureHandlerRootView>
        </AuthProvider>
    );
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

const getStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    header: {
      backgroundColor: theme.bg,
      borderBottomColor: theme.bg,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      elevation: 2,
    },
    card: {
      marginVertical: 2,
      paddingVertical: 13,
      paddingHorizontal: 13,
    },
    cardSkeletonView: {
      alignItems: "center",
      justifyContent: "center",
      margin: 4,
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
      backgroundColor: theme.cardBg,
      borderTopLeftRadius: theme.isModern ? 24 : 12,
      borderTopRightRadius: theme.isModern ? 24 : 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    closeButton: {
      padding: 7,
      width: 32,
      height: 32,
      borderRadius: theme.isModern ? 16 : 35,
      backgroundColor: theme.isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
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
      color: theme.textColor,
    },
  });
