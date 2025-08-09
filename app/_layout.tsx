import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack>
    <Stack.Screen
    name='index'
    options={{headerShown: false}}
    />
    <Stack.Screen
    name='account'
    options={{headerShown: false}}
    />
        <Stack.Screen
    name='updatelog'
    options={{headerShown: false}}
    />
        <Stack.Screen
    name='settings'
    options={{headerShown: false}}
    />
        <Stack.Screen
    name='about'
    options={{headerShown: false}}
    />
        <Stack.Screen
    name='impressum'
    options={{headerShown: false}}
    />
            <Stack.Screen
    name='bugreport'
    options={{headerShown: false}}
    />
  </Stack>
}
