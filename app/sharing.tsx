import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MapPin, Plus, ScanLine, ShieldCheck, X } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useSharingStore } from "@/lib/sharing/state";
import { sharingManager } from "@/lib/sharing/channel";
import {
  getOrCreateIdentity,
  loadSession,
  saveSession,
  clearSession,
  type ShareSession,
} from "@/lib/sharing/storage";
import {
  deriveChannelName,
  randomBytesBase64,
  randomHex,
  wrapDek,
  unwrapDek,
} from "@/lib/sharing/crypto";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import {
  encodeIdentityQr,
  encodeInviteQr,
  parseQrContent,
  type IdentityPayload,
} from "@/lib/sharing/qr";

type Route =
  | { name: "landing" }
  | { name: "identity" }
  | { name: "admin-pending" }
  | { name: "scan-identity" }
  | { name: "confirm-member"; member: IdentityPayload }
  | { name: "invite"; member: IdentityPayload; memberName: string }
  | { name: "scan-invite" }
  | { name: "joined" };

const FAILED = "DECRYPT_FAILED";

export default function SharingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const peers = useSharingStore((s) => s.peers);

  const [route, setRoute] = useState<Route>({ name: "landing" });
  const [session, setSession] = useState<ShareSession | null>(null);
  const [name, setName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identityQr, setIdentityQr] = useState<string | null>(null);
  const [inviteQr, setInviteQr] = useState<{ value: string; memberName: string } | null>(null);
  const processingRef = useRef(false);

  const active = useSharingStore((s) => s.active);
  const isAdmin = useSharingStore((s) => s.isAdmin);
  const sending = useSharingStore((s) => s.sending);

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const boot = async () => {
      await sharingManager.bootstrap();
      const id = await getOrCreateIdentity();
      setName(id.name ?? "");
      const loaded = await loadSession();
      if (loaded) {
        setSession(loaded);
        setRoute(loaded.isAdmin && loaded.members.length === 0 ? { name: "admin-pending" } : { name: "joined" });
      }
    };
    void boot();
  }, []);

  const goLanding = () => {
    setIdentityQr(null);
    setInviteQr(null);
    setError(null);
    setRoute({ name: "landing" });
  };

  const createFamily = async () => {
    setBusy(true);
    setError(null);
    try {
      const identity = await getOrCreateIdentity(name);
      const familyId = randomHex(16);
      const dek = randomBytesBase64(32);
      const channelName = await deriveChannelName(familyId, dek);
      const session: ShareSession = {
        epoch: Date.now(),
        familyId,
        dek,
        channelName,
        isAdmin: true,
        active: false,
        adminName: name,
        adminSignPublicKey: identity.signPublicKey,
        adminBoxPublicKey: identity.boxPublicKey,
        members: [],
      };
      await saveSession(session);
      setSession(session);
      setRoute({ name: "admin-pending" });
    } catch {
      setError("create-failed");
    } finally {
      setBusy(false);
    }
  };

  const showIdentity = async () => {
    const identity = await getOrCreateIdentity(name);
    setIdentityQr(
      encodeIdentityQr({
        v: 1,
        k: identity.signPublicKey,
        b: identity.boxPublicKey,
        n: name,
      }),
    );
    setRoute({ name: "identity" });
  };

  const createInvite = async () => {
    if (route.name !== "confirm-member") return;
    setBusy(true);
    setError(null);
    try {
      const session = await loadSession();
      const identity = await getOrCreateIdentity(name);
      if (!session || !identity) throw new Error(FAILED);
      const wrapped = wrapDek(
        decodeBase64(session.dek),
        route.member.b,
        identity.boxSecretKey,
      );
      const inviteValue = encodeInviteQr({
        v: 1,
        f: session.familyId,
        w: { n: wrapped.nonce, c: wrapped.box },
        a: {
          k: identity.signPublicKey,
          b: identity.boxPublicKey,
          n: name,
        },
      });
      const memberId = route.member.k.slice(-16);
      const already = session.members.some((m) => m.signPublicKey === route.member.k);
      const members = already
        ? session.members
        : [
            ...session.members,
            {
              id: memberId,
              name: memberName || t("Sharing_member_default"),
              signPublicKey: route.member.k,
              boxPublicKey: route.member.b,
            },
          ];
      const updated = { ...session, members };
      await saveSession(updated);
      setSession(updated);
      setInviteQr({ value: inviteValue, memberName: memberName || t("Sharing_member_default") });
      setRoute({ name: "invite", member: route.member, memberName });
    } catch {
      setError("invite-failed");
    } finally {
      setBusy(false);
    }
  };

  const applyInvite = async (content: string) => {
    setBusy(true);
    setError(null);
    try {
      const parsed = parseQrContent(content);
      if (!parsed || parsed.kind !== "invite") {
        setError("qr-invalid");
        return;
      }
      const identity = await getOrCreateIdentity(name);
      const dek = unwrapDek(
        parsed.data.w.n,
        parsed.data.w.c,
        parsed.data.a.b,
        identity.boxSecretKey,
      );
      if (!dek) {
        setError("qr-invalid");
        return;
      }
      const dekB64 = encodeBase64(dek);
      const channelName = await deriveChannelName(parsed.data.f, dekB64);
      const created = {
        epoch: Date.now(),
        familyId: parsed.data.f,
        dek: dekB64,
        channelName,
        isAdmin: false,
        active: false,
        adminName: parsed.data.a.n,
        adminSignPublicKey: parsed.data.a.k,
        adminBoxPublicKey: parsed.data.a.b,
        members: [],
      };
      await saveSession(created);
      setSession(created);
      setRoute({ name: "joined" });
    } catch {
      setError("invite-failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleSharing = async () => {
    setBusy(true);
    setError(null);
    try {
      if (active) {
        await sharingManager.stopSharing();
      } else {
        const session = await loadSession();
        if (!session) throw new Error(FAILED);
        await sharingManager.start(session, true);
      }
    } catch {
      setError("toggle-failed");
    } finally {
      setBusy(false);
    }
  };

  const leaveFamily = async () => {
    setBusy(true);
    setError(null);
    try {
      if (active) {
        await sharingManager.stopSharing();
      }
      await clearSession();
      useSharingStore.getState().reset();
      goLanding();
    } catch {
      setError("leave-failed");
    } finally {
      setBusy(false);
    }
  };

  // ── camera scan handler ──────────────────────────────────────────────────
  const onBarcode = ({ data }: { data: string }) => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const parsed = parseQrContent(data);
      if (!parsed) return;
      if (parsed.kind === "identity" && route.name === "scan-identity") {
        setRoute({ name: "confirm-member", member: parsed.data });
      } else if (parsed.kind === "invite" && route.name === "scan-invite") {
        void applyInvite(data);
      }
    } finally {
      setTimeout(() => {
        processingRef.current = false;
      }, 800);
    }
  };

  if (route.name === "landing" || route.name === "identity") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <Header title={t("Sharing_title")} onBack={() => router.canGoBack() ? router.back() : router.navigate("/")} />
        <Text style={styles.paragraph}>{t("Sharing_intro")}</Text>

        <Field label={t("Sharing_my_name")}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("Sharing_name_placeholder")}
            placeholderTextColor={theme.subTextColor}
          />
        </Field>

        {route.name === "landing" ? (
          <>
            <Pressable
              style={[styles.primaryBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={() => void createFamily()}
            >
              {busy ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <ShieldCheck size={18} color={theme.white} />
              )}
              <Text style={styles.primaryBtnText}>{t("Sharing_create_family")}</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={() => void showIdentity()}
            >
              <ScanLine size={18} color={theme.accentColor} />
              <Text style={styles.secondaryBtnText}>{t("Sharing_show_identity")}</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={() => {
                if (!permission?.granted) void requestPermission();
                setRoute({ name: "scan-invite" });
              }}
            >
              <ScanLine size={18} color={theme.accentColor} />
              <Text style={styles.secondaryBtnText}>{t("Sharing_scan_invite")}</Text>
            </Pressable>

            <NoticeBox text={t("Sharing_scan_in_person")} />
          </>
        ) : (
          <>
            <Text style={styles.secondaryHeadline}>{t("Sharing_my_identity_title")}</Text>
            <Text style={styles.paragraph}>{t("Sharing_my_identity_hint")}</Text>
            {identityQr ? (
              <View style={styles.qrCard}>
                <QRCode value={identityQr} size={220} />
              </View>
            ) : (
              <Text style={styles.muted}>{t("Sharing_enter_name_first")}</Text>
            )}
            <Pressable style={styles.secondaryBtn} onPress={goLanding}>
              <X size={18} color={theme.accentColor} />
              <Text style={styles.secondaryBtnText}>{t("Common_back")}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    );
  }

  if (route.name === "scan-identity" || route.name === "scan-invite") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.cameraHeader}>
          <Pressable
            onPress={() => {
              processingRef.current = false;
              setRoute(route.name === "scan-identity" ? { name: "admin-pending" } : { name: "landing" });
            }}
            style={styles.cameraClose}
          >
            <X size={22} color="#fff" />
          </Pressable>
          <Text style={styles.cameraTitle}>
            {route.name === "scan-identity" ? t("Sharing_scan_identity") : t("Sharing_scan_invite")}
          </Text>
        </View>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={onBarcode}
          />
        ) : (
          <View style={styles.cameraPrompt}>
            <Text style={styles.cameraPromptText}>{t("Sharing_camera_permission")}</Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => void requestPermission()}
            >
              <Text style={styles.primaryBtnText}>{t("Sharing_grant_camera")}</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.cameraHint}>
          <Text style={styles.cameraHintText}>{t("Sharing_scan_in_person")}</Text>
        </View>
      </View>
    );
  }

  if (route.name === "confirm-member") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <Header
          title={t("Sharing_confirm_member")}
          onBack={() => setRoute({ name: "admin-pending" })}
        />
        <Text style={styles.paragraph}>
          {t("Sharing_confirm_member_hint", {
            member: route.member.n || route.member.k.slice(-8),
          })}
        </Text>
        <Field label={t("Sharing_member_name")}>
          <TextInput
            style={styles.input}
            value={memberName}
            onChangeText={setMemberName}
            placeholder={t("Sharing_name_placeholder")}
            placeholderTextColor={theme.subTextColor}
          />
        </Field>
        {error && <Text style={styles.errorText}>{t(`Sharing_error_${error}`)}</Text>}
        <Pressable
          style={[styles.primaryBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={() => void createInvite()}
        >
          {busy ? <ActivityIndicator color={theme.white} /> : <Plus size={18} color={theme.white} />}
          <Text style={styles.primaryBtnText}>{t("Sharing_create_invite")}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => setRoute({ name: "admin-pending" })}>
          <X size={18} color={theme.accentColor} />
          <Text style={styles.secondaryBtnText}>{t("Common_cancel")}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (route.name === "invite" && inviteQr) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <Header title={t("Sharing_invite_title")} onBack={goLanding} />
        <Text style={styles.paragraph}>{t("Sharing_invite_hint")}</Text>
        <View style={styles.qrCard}>
          <QRCode value={inviteQr.value} size={220} />
        </View>
        <Pressable style={styles.secondaryBtn} onPress={() => setRoute({ name: "joined" })}>
          <Text style={styles.secondaryBtnText}>{t("Common_done")}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // admin-pending (admin, no members yet) or joined (admin w/ members or member)
  const adminPending = route.name === "admin-pending";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <Header title={t("Sharing_title")} onBack={() => router.canGoBack() ? router.back() : router.navigate("/")} />

      <View style={styles.stateCard}>
        <View style={[styles.stateDot, { backgroundColor: active ? theme.accentColor : theme.subTextColor }]} />
        <Text style={styles.stateText}>
          {active ? t("Sharing_state_active") : t("Sharing_state_inactive")}
        </Text>
      </View>

      <View style={styles.rowCard}>
        <View style={styles.rowCardText}>
          <Text style={styles.rowCardTitle}>{t("Sharing_toggle_title")}</Text>
          <Text style={styles.rowCardSub}>
            {sending ? t("Sharing_toggle_on_sub") : t("Sharing_toggle_off_sub")}
          </Text>
        </View>
        <Switch
          value={active}
          disabled={busy}
          onValueChange={() => void toggleSharing()}
          trackColor={{ false: theme.borderColor, true: theme.accentColor }}
          thumbColor="#fff"
        />
      </View>

      {error && <Text style={styles.errorText}>{t(`Sharing_error_${error}`)}</Text>}

      {adminPending && (
        <Pressable
          style={[styles.secondaryBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={() => {
            if (!permission?.granted) void requestPermission();
            setRoute({ name: "scan-identity" });
          }}
        >
          <Plus size={18} color={theme.accentColor} />
          <Text style={styles.secondaryBtnText}>{t("Sharing_add_member")}</Text>
        </Pressable>
      )}

      {!adminPending && (
        <>
          <Text style={styles.secondaryHeadline}>{t("Sharing_members_title")}</Text>
          <View style={styles.membersCard}>
            <MemberRow
              name={session?.adminName ?? t("Sharing_admin_label")}
              peer={peers[session?.adminSignPublicKey.slice(-16) ?? ""]}
              isAdmin
            />
            {(session?.members ?? []).map((m) => {
              const peer = peers[m.id];
              return (
                <MemberRow key={m.id} name={m.name ?? m.id.slice(0, 8)} peer={peer} />
              );
            })}
          </View>
          {isAdmin && (
            <Pressable
              style={[styles.secondaryBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={() => {
                if (!permission?.granted) void requestPermission();
                setRoute({ name: "scan-identity" });
              }}
            >
              <Plus size={18} color={theme.accentColor} />
              <Text style={styles.secondaryBtnText}>{t("Sharing_add_member")}</Text>
            </Pressable>
          )}
          <Pressable style={[styles.dangerBtn, busy && styles.disabled]} disabled={busy} onPress={() => void leaveFamily()}>
            <Text style={styles.dangerBtnText}>{t("Sharing_leave_family")}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

// ── small building blocks -----------------------------------------------------

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <Text style={{ fontFamily: fonts.displayBold, fontSize: 24, color: theme.textColor, flex: 1 }}>
        {title}
      </Text>
      <Pressable onPress={onBack} hitSlop={8}>
        <X size={22} color={theme.subTextColor} />
      </Pressable>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: theme.subTextColor, marginBottom: 8 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function NoticeBox({ text }: { text: string }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        backgroundColor: theme.infoLight,
        borderLeftWidth: 3,
        borderLeftColor: theme.info,
      }}
    >
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: theme.textColor }}>
        {text}
      </Text>
    </View>
  );
}

function MemberRow({
  name,
  peer,
  isAdmin,
}: {
  name: string;
  peer?: { status?: string };
  isAdmin?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const status = peer?.status ?? "unknown";
  const label =
    status === "online"
      ? t("Sharing_status_online")
      : status === "offline"
        ? t("Sharing_status_offline")
        : status === "ended"
          ? t("Sharing_status_ended")
          : t("Sharing_status_unknown");
  const color =
    status === "online" ? theme.success : theme.subTextColor;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}>
      <MapPin size={16} color={theme.accentColor} />
      <Text
        style={{
          flex: 1,
          marginLeft: 10,
          fontFamily: fonts.medium,
          fontSize: 15,
          color: theme.textColor,
        }}
      >
        {name}
        {isAdmin ? ` · ${t("Sharing_admin_label")}` : ""}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color }}>
        {label}
      </Text>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { padding: 20, paddingTop: 70, paddingBottom: 40 },
    paragraph: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 21,
      color: theme.subTextColor,
      marginBottom: 18,
    },
    muted: { fontFamily: fonts.regular, fontSize: 13, color: theme.subTextColor, marginBottom: 16 },
    secondaryHeadline: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: theme.subTextColor,
      marginTop: 8,
      marginBottom: 10,
      letterSpacing: 0.4,
    },
    input: {
      backgroundColor: theme.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.borderColor,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: theme.textColor,
    },
    primaryBtn: {
      backgroundColor: theme.accentColor,
      borderRadius: 16,
      paddingVertical: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 12,
    },
    primaryBtnText: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: theme.white,
    },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 12,
      backgroundColor: theme.cardBg,
    },
    secondaryBtnText: { fontFamily: fonts.semibold, fontSize: 15, color: theme.accentColor },
    dangerBtn: {
      borderWidth: 1,
      borderColor: theme.dangerLight,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: theme.dangerLight,
      marginTop: 8,
    },
    dangerBtnText: { fontFamily: fonts.semibold, fontSize: 15, color: theme.danger },
    disabled: { opacity: 0.6 },
    qrCard: {
      alignItems: "center",
      padding: 20,
      backgroundColor: "#fff",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 16,
    },
    errorText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: theme.danger,
      marginBottom: 12,
    },
    stateCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 14,
    },
    stateDot: { width: 10, height: 10, borderRadius: 5 },
    stateText: {
      marginLeft: 10,
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: theme.textColor,
    },
    rowCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 14,
    },
    rowCardText: { flex: 1, paddingRight: 12 },
    rowCardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: theme.textColor, marginBottom: 2 },
    rowCardSub: { fontFamily: fonts.regular, fontSize: 13, color: theme.subTextColor },
    membersCard: {
      borderRadius: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.borderColor,
      paddingBottom: 6,
    },
    cameraHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      paddingTop: 60,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    cameraClose: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    cameraTitle: { fontFamily: fonts.semibold, fontSize: 16, color: "#fff" },
    cameraHint: {
      position: "absolute",
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    cameraHintText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: "#fff",
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      overflow: "hidden",
    },
    cameraPrompt: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 28,
      backgroundColor: theme.bg,
    },
    cameraPromptText: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: theme.subTextColor,
      textAlign: "center",
      marginBottom: 18,
    },
  });