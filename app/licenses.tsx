import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { ChevronLeft, FileText } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

/** Shared MIT permission text (SPDX: MIT). */
const MIT_BODY =
  'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.';

function mit(copyright: string): string {
  return `MIT License\n\n${copyright}\n\n${MIT_BODY}`;
}

const APACHE2_LOTTIE = `Copyright (c) Airbnb, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`;

const LICENSE_DATA: { title: string; content: string }[] = [
  {
    title: "Expo",
    content: mit("Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)"),
  },
  {
    title: "Expo Vector-Icons",
    content: mit(
      "Copyright (c) 2015 Joel Arvidsson\nCopyright (c) 2020 650 Industries",
    ),
  },
  {
    title: "Expo SDK modules",
    content:
      mit("Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)") +
      "\n\nIncludes npm packages used in this app: expo-application, expo-asset, expo-blur, expo-clipboard, expo-constants, expo-dev-client, expo-device, expo-file-system, expo-font, expo-haptics, expo-image, expo-image-picker, expo-linear-gradient, expo-linking, expo-location, expo-notifications, expo-router, expo-secure-store, expo-splash-screen, expo-sqlite, expo-status-bar, expo-symbols, expo-system-ui, expo-updates, expo-web-browser.",
  },
  {
    title: "React",
    content: mit("Copyright (c) Meta Platforms, Inc. and affiliates."),
  },
  {
    title: "React-Native",
    content: mit("Copyright (c) Meta Platforms, Inc. and affiliates."),
  },
  {
    title: "react-dom & react-native-web",
    content: mit("Copyright (c) Meta Platforms, Inc. and affiliates."),
  },
  {
    title: "@react-navigation/bottom-tabs",
    content: mit("Copyright (c) React Navigation contributors"),
  },
  {
    title: "Lucide Icons",
    content:
      'ISC License Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025. Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies. THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.',
  },
  {
    title: "i18next",
    content: mit("Copyright (c) i18next"),
  },
  {
    title: "react-i18next",
    content: mit("Copyright (c) i18next"),
  },
  {
    title: "Zustand",
    content: mit("Copyright (c) Poimandres"),
  },
  {
    title: "@supabase/supabase-js",
    content: mit("Copyright (c) Supabase"),
  },
  {
    title: "@sentry/react-native",
    content: mit("Copyright (c) Functional Software, Inc. d/b/a Sentry"),
  },
  {
    title: "posthog-react-native",
    content: mit("Copyright (c) PostHog, Inc."),
  },
  {
    title: "react-native-maplibre-gl-js",
    content: mit("Copyright (c) MapLibre contributors"),
  },
  {
    title: "@gorhom/bottom-sheet",
    content: mit("Copyright (c) Mo Gorhom"),
  },
  {
    title: "react-native-reanimated, gesture-handler, screens, worklets, svg",
    content: mit("Copyright (c) Software Mansion"),
  },
  {
    title: "lottie-react-native",
    content: `Apache License, Version 2.0\n\n${APACHE2_LOTTIE}`,
  },
  {
    title: "@notifee/react-native",
    content: `Apache License, Version 2.0

Copyright 2015-present invertase.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
  },
  {
    title: "React Native Community packages",
    content:
      mit("Copyright (c) React Native Community") +
      "\n\nIncludes: @react-native-async-storage/async-storage, react-native-safe-area-context.",
  },
  {
    title: "react-native-url-polyfill",
    content: mit("Copyright (c) Mathieu Acthernoene"),
  },
  {
    title: "@avatune/react-native & @avatune/nevmstas-theme",
    content: mit("Copyright (c) avatune"),
  },
  {
    title: "@hcaptcha/react-native-hcaptcha",
    content: mit(
      "Copyright (c) Intuition Machines, Inc. and hCaptcha contributors",
    ),
  },
  {
    title: "eventemitter3",
    content: mit("Copyright (c) Arnout Kazemier and contributors"),
  },
  {
    title: "@shopify/flash-list",
    content: mit("Copyright (c) 2022 Shopify"),
  },
];

export default function Licenses() {
  const theme = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Licenses_screen_title")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <FileText size={40} color={theme.primary} strokeWidth={2} />
          <Text style={styles.introTitle}>Open Source Licenses</Text>
          <Text style={styles.introSub}>
            The software components used in Atlasys (direct dependencies from
            package.json). Transitive packages are subject to the same or
            compatible licenses in their respective node_modules entries.
          </Text>
        </View>

        {LICENSE_DATA.map((license, index) => (
          <View key={index} style={styles.licenseCard}>
            <Text style={styles.licenseTitle}>{license.title}</Text>
            <View style={styles.licenseContentWrapper}>
              <Text style={styles.licenseText}>{license.content}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    cardBgSecondary,
    textColor,
    subTextColor,
    borderColor,
    isModern,
  } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: textColor,
    },
    backButton: {
      padding: 8,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    introSection: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 12,
    },
    introTitle: {
      fontSize: 24,
      fontFamily: fonts.bold,
      color: textColor,
      marginTop: 16,
    },
    introSub: {
      fontSize: 15,
      color: subTextColor,
      textAlign: "center",
      marginTop: 8,
      paddingHorizontal: 20,
    },
    licenseCard: {
      backgroundColor: cardBg,
      borderRadius: isModern ? 32 : 24,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    licenseTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: textColor,
      marginBottom: 12,
    },
    licenseContentWrapper: {
      backgroundColor: cardBgSecondary,
      padding: 16,
      borderRadius: isModern ? 24 : 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    licenseText: {
      fontSize: 13,
      lineHeight: 20,
      color: subTextColor,
      fontFamily: "monospace",
    },
  });
};
