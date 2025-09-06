import { Stack } from "expo-router";
import React from 'react';

//function RouteGuard({ children }: { children: React.ReactNode }) {
//  const router = useRouter();
//  const { user, isLoadingUser } = useAuth();
//  const segments = useSegments();
  

//  useEffect(() => {
//    const inAuthGroup = segments[0] === "auth"
//    if (!user && !inAuthGroup && !isLoadingUser) {
//      router.replace("/auth");
//    } else if (user && inAuthGroup && !isLoadingUser) {
//      router.replace("/")
//    }  
//  }, [user, segments, ]);
//
//  return <>{children}</>;
//}

export default function RootLayout() {
  return (
//    <AuthProvider>
//      <RouteGuard>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ headerShown: false }} />
          <Stack.Screen name="bugreport" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="updatelog" options={{ headerShown: false }} />
          <Stack.Screen name="invite" options={{ headerShown: false }} />
          <Stack.Screen name="profilescreen" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
//      </RouteGuard>
//    </AuthProvider>
  );
}
