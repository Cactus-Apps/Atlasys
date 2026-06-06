import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
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

const BSD3_SNAP_CAROUSEL = `Copyright (c) 2017 archriss

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;

const BSD2_MAPLIBRE = `Copyright (c) MapLibre contributors

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;

const SIL_OFL_GOOGLE_FONTS = `The font files distributed via @expo-google-fonts/dm-sans and @expo-google-fonts/syne are from Google Fonts and are licensed under the SIL Open Font License, Version 1.1.

Full license text: https://openfontlicense.org/OFL-1_1.txt

PREAMBLE — The goals of the Open Font License (OFL) are to stimulate worldwide development of collaborative font projects, to support the font creation efforts of academic and linguistic communities, and to provide a free and open framework in which fonts may be shared and improved in partnership with others.

PERMISSION & CONDITIONS — Permission is hereby granted, free of charge, to any person obtaining a copy of the Font Software, to use, study, copy, merge, embed, modify, redistribute, and sell modified and unmodified copies of the Font Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components, in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled, redistributed and/or sold with any software, provided that each copy contains the above copyright notice and this license.

3) No Modified Version of the Font Software may use the Reserved Font Name(s) unless explicit written permission is granted by the corresponding Copyright Holder.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font Software shall not be used to promote, endorse or advertise any Modified Version, except to acknowledge the contribution(s) of the Copyright Holder(s) and the Author(s) or with their explicit written permission.

5) The Font Software, modified or unmodified, in part or in whole, must be distributed entirely under this license, and must not be distributed under any other license.

TERMINATION — This license becomes null and void if any of the above conditions are not met.

DISCLAIMER — THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE FONT SOFTWARE.`;

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
    title: "@expo/ui",
    content: mit("Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)"),
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
    title: "@ant-design/icons",
    content: mit("Copyright (c) 2018-present Ant UED"),
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
    title: "@maplibre/maplibre-react-native",
    content: `BSD 2-Clause License\n\n${BSD2_MAPLIBRE}`,
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
    title: "react-native-reanimated-dnd",
    content: mit("Copyright (c) Vishesh Raheja and contributors"),
  },
  {
    title: "react-native-paper",
    content: mit("Copyright (c) Callstack"),
  },
  {
    title: "moti",
    content: mit("Copyright (c) Fernando Rojo"),
  },
  {
    title: "react-native-purchases & react-native-purchases-ui",
    content: mit("Copyright (c) RevenueCat, Inc."),
  },
  {
    title: "lottie-react-native",
    content: `Apache License, Version 2.0\n\n${APACHE2_LOTTIE}`,
  },
  {
    title: "@lottiefiles/dotlottie-react",
    content: mit("Copyright (c) LottieFiles.com"),
  },
  {
    title: "React Native Community packages",
    content:
      mit("Copyright (c) React Native Community") +
      "\n\nIncludes: @react-native-async-storage/async-storage, @react-native-community/slider, @react-native-picker/picker, react-native-safe-area-context, react-native-webview.",
  },
  {
    title: "react-native-draggable-flatlist",
    content: mit("Copyright (c) computerjazz"),
  },
  {
    title: "react-native-snap-carousel",
    content: `BSD 3-Clause License\n\n${BSD3_SNAP_CAROUSEL}`,
  },
  {
    title: "react-native-toast-message",
    content: mit("Copyright (c) Calin Tamas"),
  },
  {
    title: "react-native-url-polyfill",
    content: mit("Copyright (c) Mathieu Acthernoene"),
  },
  {
    title: "@kolking/react-native-avatar",
    content: mit("Copyright (c) kolking"),
  },
  {
    title: "@avatune/react-native & @avatune/nevmstas-theme",
    content: mit("Copyright (c) avatune"),
  },
  {
    title: "react-native-vector-icons",
    content: mit("Copyright (c) 2016 Joel Arvidsson"),
  },
  {
    title: "@hcaptcha/react-native-hcaptcha",
    content: mit(
      "Copyright (c) Intuition Machines, Inc. and hCaptcha contributors",
    ),
  },
  {
    title: "@expo-google-fonts (DM Sans, Syne)",
    content: SIL_OFL_GOOGLE_FONTS,
  },
  {
    title: "express",
    content: mit("Copyright (c) Express contributors"),
  },
  {
    title: "node-fetch",
    content: mit("Copyright (c) David Frank and node-fetch contributors"),
  },
  {
    title: "eventemitter3",
    content: mit("Copyright (c) Arnout Kazemier and contributors"),
  },
  {
    title: "react-native-async-storage (legacy meta-package)",
    content: mit("Copyright (c) React Native Community"),
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
    primary,
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
      fontWeight: "700",
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
      fontWeight: "800",
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
      fontWeight: "800",
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
