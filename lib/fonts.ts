import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { Lora_600SemiBold, Lora_700Bold } from "@expo-google-fonts/lora";

export function useAppFonts() {
  return useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Lora_600SemiBold,
    Lora_700Bold,
  });
}

export const fonts = {
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semibold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
  display: "Lora_600SemiBold",
  displayBold: "Lora_700Bold",
} as const;
