import React from "react";
import { View } from "react-native";

type Props = {
  type: "modern" | "new" | "native";
  isActive: boolean;
  bg: string;
  card: string;
  accent: string;
  text: string;
  sub: string;
};

function Dot({
  active,
  accent,
  sub,
}: {
  active: boolean;
  accent: string;
  sub: string;
}) {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: active ? accent : "transparent",
        borderWidth: 1.5,
        borderColor: active ? accent : sub,
      }}
    />
  );
}

function Square({
  active,
  accent,
  sub,
}: {
  active: boolean;
  accent: string;
  sub: string;
}) {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 2,
        backgroundColor: active ? accent : sub,
        opacity: active ? 1 : 0.45,
      }}
    />
  );
}

function Filled({
  active,
  accent,
  sub,
}: {
  active: boolean;
  accent: string;
  sub: string;
}) {
  return (
    <View
      style={{
        width: 7,
        height: 7,
        borderRadius: 1.5,
        backgroundColor: active ? accent : sub,
        opacity: active ? 1 : 0.5,
      }}
    />
  );
}

function ModernPreview({ bg, card, accent, sub }: Omit<Props, "type" | "isActive" | "text">) {
  return (
    <>
      <View style={{ flex: 1, padding: 7 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: card,
            borderRadius: 5,
          }}
        />
      </View>
      <View
        style={{
          height: 20,
          backgroundColor: bg,
          flexDirection: "row",
          alignItems: "center",
          borderTopWidth: 0.5,
          borderTopColor: sub,
        }}
      >
        {[true, false, false].map((active, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Dot active={active} accent={accent} sub={sub} />
          </View>
        ))}
      </View>
    </>
  );
}

function NewPreview({ bg, card, accent, sub }: Omit<Props, "type" | "isActive" | "text">) {
  return (
    <>
      <View style={{ flex: 1, padding: 7 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: card,
            borderRadius: 5,
            opacity: 0.5,
          }}
        />
      </View>
      <View style={{ backgroundColor: card }}>
        <View
          style={{
            height: 2,
            width: "30%",
            backgroundColor: accent,
            borderBottomRightRadius: 1,
            borderBottomLeftRadius: 1,
          }}
        />
        <View
          style={{
            height: 20,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {[true, false, false].map((active, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 1 }}>
              <Square active={active} accent={accent} sub={sub} />
              <View
                style={{
                  width: 10,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: active ? accent : sub,
                  opacity: active ? 1 : 0.35,
                }}
              />
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function NativePreview({ bg, card, accent, sub }: Omit<Props, "type" | "isActive" | "text">) {
  return (
    <>
      <View style={{ flex: 1, padding: 7 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: card,
            borderRadius: 5,
          }}
        />
      </View>
      <View
        style={{
          height: 22,
          backgroundColor: bg,
          flexDirection: "row",
          alignItems: "center",
          borderTopWidth: 0.5,
          borderTopColor: sub,
        }}
      >
        {[true, false, false].map((active, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <Filled active={active} accent={accent} sub={sub} />
            <View
              style={{
                width: 8,
                height: 2,
                borderRadius: 1,
                backgroundColor: active ? accent : sub,
                opacity: active ? 1 : 0.35,
              }}
            />
          </View>
        ))}
      </View>
    </>
  );
}

export function TabBarPreview({ type, bg, card, accent, text, sub }: Props) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {type === "modern" && (
        <ModernPreview bg={bg} card={card} accent={accent} sub={sub} />
      )}
      {type === "new" && (
        <NewPreview bg={bg} card={card} accent={accent} sub={sub} />
      )}
      {type === "native" && (
        <NativePreview bg={bg} card={card} accent={accent} sub={sub} />
      )}
    </View>
  );
}
