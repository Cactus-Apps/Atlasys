import * as React from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";

export default function licenses() {
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  return (
    <GestureHandlerRootView>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.paragraph}>
            <Text style={styles.title}>Expo</Text>
            <Text style={styles.text}>
              The MIT License (MIT) Copyright (c) 2015-present 650 Industries,
              Inc. (aka Expo) Permission is hereby granted, free of charge, to
              any person obtaining a copy of this software and associated
              documentation files (the "Software"), to deal in the Software
              without restriction, including without limitation the rights to
              use, copy, modify, merge, publish, distribute, sublicense, and/or
              sell copies of the Software, and to permit persons to whom the
              Software is furnished to do so, subject to the following
              conditions: The above copyright notice and this permission notice
              shall be included in all copies or substantial portions of the
              Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
              ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
              AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
              HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
              WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
              OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
              DEALINGS IN THE SOFTWARE.
            </Text>
          </View>
        </View>
        <View style={styles.paragraph}>
          <Text style={styles.title}>Expo Vector-Icons</Text>
          <Text style={styles.text}>
            The MIT License (MIT) Copyright (c) 2015 Joel Arvidsson Copyright
            (c) 2020 650 Industries Permission is hereby granted, free of
            charge, to any person obtaining a copy of this software and
            associated documentation files (the "Software"), to deal in the
            Software without restriction, including without limitation the
            rights to use, copy, modify, merge, publish, distribute, sublicense,
            and/or sell copies of the Software, and to permit persons to whom
            the Software is furnished to do so, subject to the following
            conditions: The above copyright notice and this permission notice
            shall be included in all copies or substantial portions of the
            Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
            KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
            NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
            BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
            ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
            CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </Text>
        </View>
        <View style={styles.paragraph}>
          <Text style={styles.title}>React-Native</Text>
          <Text style={styles.text}>
            MIT License Copyright (c) Meta Platforms, Inc. and affiliates.
            Permission is hereby granted, free of charge, to any person
            obtaining a copy of this software and associated documentation files
            (the "Software"), to deal in the Software without restriction,
            including without limitation the rights to use, copy, modify, merge,
            publish, distribute, sublicense, and/or sell copies of the Software,
            and to permit persons to whom the Software is furnished to do so,
            subject to the following conditions: The above copyright notice and
            this permission notice shall be included in all copies or
            substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS
            IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
            NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
            OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
            OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
            OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
          </Text>
        </View>
        <View style={styles.paragraph}>
          <Text style={styles.title}>React</Text>
          <Text style={styles.text}>
            MIT License Copyright (c) Meta Platforms, Inc. and affiliates.
            Permission is hereby granted, free of charge, to any person
            obtaining a copy of this software and associated documentation files
            (the "Software"), to deal in the Software without restriction,
            including without limitation the rights to use, copy, modify, merge,
            publish, distribute, sublicense, and/or sell copies of the Software,
            and to permit persons to whom the Software is furnished to do so,
            subject to the following conditions: The above copyright notice and
            this permission notice shall be included in all copies or
            substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS
            IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
            NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
            OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
            OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
            OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
          </Text>
        </View>
        <View style={styles.paragraph}>
          <Text style={styles.title}>Lucide Icons</Text>
          <Text style={styles.text}>
            ISC License Copyright (c) for portions of Lucide are held by Cole
            Bemis 2013-2023 as part of Feather (MIT). All other copyright (c)
            for Lucide are held by Lucide Contributors 2025. Permission to use,
            copy, modify, and/or distribute this software for any purpose with
            or without fee is hereby granted, provided that the above copyright
            notice and this permission notice appear in all copies. THE SOFTWARE
            IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
            REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
            MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE
            FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY
            DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
            WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS
            ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
            OF THIS SOFTWARE. --- The MIT License (MIT) (for portions derived
            from Feather) Copyright (c) 2013-2023 Cole Bemis Permission is
            hereby granted, free of charge, to any person obtaining a copy of
            this software and associated documentation files (the "Software"),
            to deal in the Software without restriction, including without
            limitation the rights to use, copy, modify, merge, publish,
            distribute, sublicense, and/or sell copies of the Software, and to
            permit persons to whom the Software is furnished to do so, subject
            to the following conditions: The above copyright notice and this
            permission notice shall be included in all copies or substantial
            portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT
            WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
            TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
            COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
            ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
            OR OTHER DEALINGS IN THE SOFTWARE.
          </Text>
        </View>
        <View style={styles.paragraph}>
          <Text style={styles.title}>react i18next</Text>
          <Text style={styles.text}>
            The MIT License (MIT) Copyright (c) 2025 i18next Permission is
            hereby granted, free of charge, to any person obtaining a copy of
            this software and associated documentation files (the "Software"),
            to deal in the Software without restriction, including without
            limitation the rights to use, copy, modify, merge, publish,
            distribute, sublicense, and/or sell copies of the Software, and to
            permit persons to whom the Software is furnished to do so, subject
            to the following conditions: The above copyright notice and this
            permission notice shall be included in all copies or substantial
            portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT
            WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
            TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
            COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
            ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
            OR OTHER DEALINGS IN THE SOFTWARE.
          </Text>
        </View>
        <View style={styles.paragraph}>
          <Text style={styles.title}>react-native-gesture-handler</Text>
          <Text style={styles.text}>
            The MIT License (MIT) Copyright (c) 2016 Software Mansion
            swmansion.com Permission is hereby granted, free of charge, to any
            person obtaining a copy of this software and associated
            documentation files (the "Software"), to deal in the Software
            without restriction, including without limitation the rights to use,
            copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software
            is furnished to do so, subject to the following conditions: The
            above copyright notice and this permission notice shall be included
            in all copies or substantial portions of the Software. THE SOFTWARE
            IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
            NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
            BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
            ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
            CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </Text>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {},
    title: {
      fontSize: 30,
      fontWeight: "600",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    text: {
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
      paddingHorizontal: 15,
      paddingVertical: 15,
      fontSize: 15,
    },
    paragraph: {
      borderWidth: 2,
      borderRadius: 15,
      borderColor: scheme === "dark" ? "#d8d8d8ff" : "#000",
      margin: 12,
    },
  });
