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

/** tweetnacl / tweetnacl-util are released into the public domain (SPDX: Unlicense). */
const UNLICENSE_TWEETNACL = `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>`;

/** Bundled typefaces: DM Sans and Lora (SPDX: OFL-1.1). */
const OFL_FONTS = `DM Sans
Copyright 2014 The DM Sans Project Authors (https://github.com/googlefonts/dm-fonts)

Lora
Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic),
with Reserved Font Name "Lora".

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://scripts.sil.org/OFL

-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE

The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply to any
document created using the fonts or their derivatives.

DEFINITIONS

"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical writer
or other person who contributed to the Font Software.

PERMISSION & CONDITIONS

Permission is hereby granted, free of charge, to any person obtaining a
copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components, in
Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or in
the appropriate machine-readable metadata fields within text or binary
files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any Modified
Version, except to acknowledge the contribution(s) of the Copyright
Holder(s) and the Author(s) or with their explicit written permission.

5) The Font Software, modified or unmodified, in part or in whole, must be
distributed entirely under this license, and must not be distributed under
any other license. The requirement for fonts to remain under this license
does not apply to any document created using the Font Software.

TERMINATION

This license becomes null and void if any of the above conditions are not
met.

EXCEPTION

As an exception, if the Font Software is a subset of a larger collection
of fonts, the above conditions apply only to the subset that is included
in the larger collection. The Font Software may therefore be distributed as
part of a larger collection, and the license of the larger collection may
supersede the license of the Font Software.

DISCLAIMER

THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER
DEALINGS IN THE FONT SOFTWARE.`;

const LICENSE_DATA: { title: string; content: string }[] = [
  {
    title: "Atlasys",
    content: `GNU General Public License v3.0 (GPLv3)

Copyright (C) Cactus Apps

Atlasys is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option)
any later version.

Atlasys is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
details.

Full license text: https://github.com/Cactus-Apps/Atlasys/blob/master/LICENSE`,
  },
  {
    title: "Expo",
    content: mit("Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)"),
  },
  {
    title: "Expo SDK modules",
    content:
      mit("Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)") +
      "\n\nIncludes npm packages used in this app: expo-application, expo-asset, expo-blur, expo-camera, expo-clipboard, expo-constants, expo-crypto, expo-dev-client, expo-device, expo-document-picker, expo-file-system, expo-font, expo-haptics, expo-image, expo-image-picker, expo-keep-awake, expo-linear-gradient, expo-linking, expo-local-authentication, expo-location, expo-notifications, expo-router, expo-screen-capture, expo-secure-store, expo-sharing, expo-sqlite, expo-status-bar, expo-symbols, expo-system-ui, expo-task-manager, expo-updates, expo-web-browser.",
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
    title: "Lucide Icons",
    content:
      'ISC License Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025. Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies. THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.',
  },
  {
    title: "i18next & react-i18next",
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
    title: "react-native-maplibre-gl-js & MapLibre GL JS",
    content: `${mit("Copyright (c) MapLibre contributors")}

MapLibre GL JS is licensed under the BSD 3-Clause License.

Copyright (c) 2023, MapLibre contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS
OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN
IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
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
    title: "react-native-webview",
    content: mit("Copyright (c) 2015-present, Facebook, Inc."),
  },
  {
    title: "lottie-react-native",
    content: `Apache License, Version 2.0\n\n${APACHE2_LOTTIE}`,
  },
  {
    title: "@lottiefiles/dotlottie-react",
    content: mit("Copyright (c) 2023 LottieFiles.com"),
  },
  {
    title: "@iternio/react-native-tts",
    content: mit("Copyright (c) Manuel Auer (Iternio-Planning-AB)"),
  },
  {
    title: "react-native-qrcode-svg",
    content: mit("Copyright (c) 2016 JerryShen"),
  },
  {
    title: "tweetnacl & tweetnacl-util",
    content: UNLICENSE_TWEETNACL,
  },
  {
    title: "DM Sans & Lora (bundled fonts)",
    content: OFL_FONTS,
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
  {
    title: "Map data, routing & other services",
    content: `Atlasys is built on open data and open web services. Their terms apply to the data they return.

OpenStreetMap
© OpenStreetMap contributors, licensed under the
Open Database License (ODbL) 1.0.
https://www.openstreetmap.org/copyright

OpenFreeMap
Map styles and tiles, open source and free to use.
https://openfreemap.org

OSRM (routing.openstreetmap.de)
Routing engine and demo server by Project OSRM.
https://project-osrm.org · https://openstreetmap.org

Nominatim
Geocoding by the Nominatim project, used under the ODbL.
https://nominatim.org

Overpass API
Map data queries, ODbL 1.0.
https://overpass-api.de

Open-Meteo
Weather data, CC BY 4.0.
https://open-meteo.com

Wikipedia, Wikidata & Wikimedia Commons
Content licensed under CC BY-SA 4.0 (text) and
CC BY-SA 4.0 / public domain (images & media).
https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use

Supabase · hCaptcha
Backend, crash reporting, opt-in analytics and bot protection,
each governed by its own terms and privacy policy.`,
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
            package.json), the bundled fonts, and the map data and services
            behind the app. Transitive packages are subject to the same or
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
