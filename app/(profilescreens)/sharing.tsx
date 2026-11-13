import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Lock,
  MapPin,
  Plus,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react-native";
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
import { killSwitchText, SUPPORT_EMAIL } from "@/lib/sharing/killSwitch";
import {
  Field,
  Header,
  NoticeBox,
} from "@/components/sharing/sharing-ui-blocks";
import {
  useFamilyScreenCaptureGuard,
  useShareLock,
} from "@/lib/sharing/appLock";

type Route =
  | { name: "landing" }
  | { name: "identity" } // set an id if not done bevor
  | { name: "admin-pending" } // host a family
  | { name: "scan-identity" } // scan an id
  | { name: "confirm-member"; member: IdentityPayload } // confirm
  | { name: "invite"; member: IdentityPayload; memberName: string }
  | { name: "scan-invite" }
  | { name: "joined" }; // in a family

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
  const [inviteQr, setInviteQr] = useState<{
    value: string;
    memberName: string;
  } | null>(null);
  const processingRef = useRef(false);
  const [confirmState, setConfirmState] = useState<{
    removingName?: string;
  } | null>(null);

  const active = useSharingStore((s) => s.active);
  const isAdmin = useSharingStore((s) => s.isAdmin);
  const sending = useSharingStore((s) => s.sending);
  const disabledReason = useSharingStore((s) => s.disabledReason);
  const disabledMessage = useSharingStore((s) => s.disabledMessage);

  const [rotated, setRotated] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  useFamilyScreenCaptureGuard();
  const { locked: sharingLocked, requestUnlock: unlockSharing } =
    useShareLock();

  useEffect(() => {
    const boot = async () => {
      await sharingManager.bootstrap();
      const id = await getOrCreateIdentity();
      setName(id.name ?? "");
      const loaded = await loadSession();
      if (loaded) {
        setSession(loaded);
        setRoute(
          loaded.isAdmin && loaded.members.length === 0
            ? { name: "admin-pending" }
            : { name: "joined" },
        );
      }
      void sharingManager.refreshKillSwitch();
    };
    void boot();
  }, []);

  const goLanding = () => {
    setIdentityQr(null);
    setInviteQr(null);
    setError(null);
    setRoute({ name: "landing" });
  };

  // create a family with an initail session
  const createFamily = async () => {
    setBusy(true);
    setError(null);
    try {
      const identity = await getOrCreateIdentity(name);
      const familyId = randomHex(16);
      const dek = randomBytesBase64(32);
      const channelName = await deriveChannelName(familyId, dek);
      const session: ShareSession = {
        epoch: 1,
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
      const already = session.members.some(
        (m) => m.signPublicKey === route.member.k,
      );
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
      setInviteQr({
        value: inviteValue,
        memberName: memberName || t("Sharing_member_default"),
      });
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
        epoch: 1,
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
        await sharingManager.start(session, true, {
          title: t("Sharing_bg_notif_title"),
          body: t("Sharing_bg_notif_body"),
        });
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

  const confirmRotate = (removingName?: string) => {
    setConfirmState({ removingName });
  };

  const otherMembersAffected = Math.max((session?.members.length ?? 0) - 1, 0);

  const performRotate = async () => {
    setBusy(true);
    setError(null);
    try {
      await sharingManager.rotate();
      const next = await loadSession();
      setSession(next ?? null);
      setRotated(true);
      setRoute({ name: "admin-pending" });
    } catch {
      setError("rotate-failed");
    } finally {
      setBusy(false);
    }
  };

  const contactSupport = () => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

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

  if (disabledReason) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <Header
          title={t("Sharing_title")}
          onBack={() =>
            router.canGoBack()
              ? router.back()
              : router.navigate("/profilescreen")
          }
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <View style={styles.disabledCard}>
            <ShieldCheck size={26} color={theme.warningDark} />
            <Text style={styles.disabledTitle}>
              {t("Sharing_disabled_title")}
            </Text>
            <Text style={styles.paragraph}>
              {killSwitchText(t, disabledReason, disabledMessage)}
            </Text>
          </View>
          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={contactSupport}
          >
            <Text style={styles.primaryBtnText}>
              {t("Sharing_support_contact")}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.navigate("/profilescreen")
            }
          >
            <X size={18} color={theme.accentColor} />
            <Text style={styles.secondaryBtnText}>{t("Common_back")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (route.name === "landing" || route.name === "identity") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <Header
          title={t("Sharing_title")}
          onBack={() =>
            router.canGoBack() ? router.back() : router.navigate("/")
          }
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
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
                <Text style={styles.primaryBtnText}>
                  {t("Sharing_create_family")}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryBtn, busy && styles.disabled]}
                disabled={busy}
                onPress={() => void showIdentity()}
              >
                <ScanLine size={18} color={theme.accentColor} />
                <Text style={styles.secondaryBtnText}>
                  {t("Sharing_show_identity")}
                </Text>
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
                <Text style={styles.secondaryBtnText}>
                  {t("Sharing_scan_invite")}
                </Text>
              </Pressable>

              <NoticeBox text={t("Sharing_scan_in_person")} />
            </>
          ) : (
            <>
              <Text style={styles.secondaryHeadline}>
                {t("Sharing_my_identity_title")}
              </Text>
              <Text style={styles.paragraph}>
                {t("Sharing_my_identity_hint")}
              </Text>
              {identityQr ? (
                <View style={styles.qrCard}>
                  <QRCode value={identityQr} size={220} />
                </View>
              ) : (
                <Text style={styles.muted}>
                  {t("Sharing_enter_name_first")}
                </Text>
              )}
              <Pressable style={styles.secondaryBtn} onPress={goLanding}>
                <X size={18} color={theme.accentColor} />
                <Text style={styles.secondaryBtnText}>{t("Common_back")}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
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
              setRoute(
                route.name === "scan-identity"
                  ? { name: "admin-pending" }
                  : { name: "landing" },
              );
            }}
            style={styles.cameraClose}
          >
            <X size={22} color="#fff" />
          </Pressable>
          <Text style={styles.cameraTitle}>
            {route.name === "scan-identity"
              ? t("Sharing_scan_identity")
              : t("Sharing_scan_invite")}
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
            <Text style={styles.cameraPromptText}>
              {t("Sharing_camera_permission")}
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => void requestPermission()}
            >
              <Text style={styles.primaryBtnText}>
                {t("Sharing_grant_camera")}
              </Text>
            </Pressable>
          </View>
        )}
        <View style={styles.cameraHint}>
          <Text style={styles.cameraHintText}>
            {t("Sharing_scan_in_person")}
          </Text>
        </View>
      </View>
    );
  }

  if (route.name === "confirm-member") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <Header
          title={t("Sharing_confirm_member")}
          onBack={() => setRoute({ name: "admin-pending" })}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
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
          {error && (
            <Text style={styles.errorText}>{t(`Sharing_error_${error}`)}</Text>
          )}
          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => void createInvite()}
          >
            {busy ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <Plus size={18} color={theme.white} />
            )}
            <Text style={styles.primaryBtnText}>
              {t("Sharing_create_invite")}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => setRoute({ name: "admin-pending" })}
          >
            <X size={18} color={theme.accentColor} />
            <Text style={styles.secondaryBtnText}>{t("Common_cancel")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (route.name === "invite" && inviteQr) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <Header title={t("Sharing_invite_title")} onBack={goLanding} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.paragraph}>{t("Sharing_invite_hint")}</Text>
          <View style={styles.qrCard}>
            <QRCode value={inviteQr.value} size={220} />
          </View>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => setRoute({ name: "joined" })}
          >
            <Text style={styles.secondaryBtnText}>{t("Common_done")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const adminPending = route.name === "admin-pending";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <Header
        title={t("Sharing_title")}
        onBack={() => router.navigate("/profilescreen")}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.stateCard}>
          <View
            style={[
              styles.stateDot,
              {
                backgroundColor: active
                  ? theme.accentColor
                  : theme.subTextColor,
              },
            ]}
          />
          <Text style={styles.stateText}>
            {active ? t("Sharing_state_active") : t("Sharing_state_inactive")}
          </Text>
        </View>

        <View style={styles.rowCard}>
          <View style={styles.rowCardText}>
            <Text style={styles.rowCardTitle}>{t("Sharing_toggle_title")}</Text>
            <Text style={styles.rowCardSub}>
              {sending
                ? t("Sharing_toggle_on_sub")
                : t("Sharing_toggle_off_sub")}
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

        {error && (
          <Text style={styles.errorText}>{t(`Sharing_error_${error}`)}</Text>
        )}

        {rotated && <NoticeBox text={t("Sharing_rotate_done")} />}
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
            <Text style={styles.secondaryBtnText}>
              {t("Sharing_add_member")}
            </Text>
          </Pressable>
        )}

        {!adminPending && (
          <>
            <Text style={styles.secondaryHeadline}>
              {t("Sharing_members_title")}
            </Text>
            {sharingLocked && (
              <Pressable
                onPress={() => void unlockSharing()}
                style={styles.unlockRow}
              >
                <Lock size={14} color={theme.subTextColor} strokeWidth={2.5} />
                <Text style={styles.unlockRowText}>
                  {t("Sharing_status_locked")}
                </Text>
              </Pressable>
            )}
            <View style={styles.membersCard}>
              <MemberRow
                name={session?.adminName ?? t("Sharing_admin_label")}
                peer={peers[session?.adminSignPublicKey.slice(-16) ?? ""]}
                isAdmin
                statusLocked={sharingLocked}
              />
              {(session?.members ?? []).map((m) => {
                const peer = peers[m.id];
                return (
                  <MemberRow
                    key={m.id}
                    name={m.name ?? m.id.slice(0, 8)}
                    peer={peer}
                    adminControls={isAdmin}
                    statusLocked={sharingLocked}
                    onRemove={() => confirmRotate(m.name ?? m.id.slice(0, 8))}
                  />
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
                <Text style={styles.secondaryBtnText}>
                  {t("Sharing_add_member")}
                </Text>
              </Pressable>
            )}
            {isAdmin && (
              <Pressable
                style={[styles.rotateBtn, busy && styles.disabled]}
                disabled={busy}
                onPress={() => confirmRotate()}
              >
                <Text style={styles.rotateBtnText}>
                  {t("Sharing_rotate_key")}
                </Text>
              </Pressable>
            )}
            {isAdmin && (
              <Text style={styles.rotateHint}>
                {t("Sharing_rotate_key_hint")}
              </Text>
            )}
          </>
        )}

        <Text style={styles.rotateHint}>{t("Sharing_screenshots_note")}</Text>

        <Pressable
          style={[styles.dangerBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={() => void leaveFamily()}
        >
          <Text style={styles.dangerBtnText}>{t("Sharing_leave_family")}</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={confirmState !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmState(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {confirmState?.removingName
                ? t("Sharing_member_remove_title")
                : t("Sharing_rotate_title")}
            </Text>
            <Text style={styles.modalText}>
              {confirmState?.removingName
                ? t("Sharing_member_remove_body", {
                    member: confirmState.removingName,
                  })
                : t("Sharing_rotate_body")}
            </Text>
            {confirmState?.removingName && otherMembersAffected > 0 && (
              <View style={styles.modalWarning}>
                <Text style={styles.modalWarningText}>
                  {t("Sharing_member_remove_others", {
                    count: otherMembersAffected,
                  })}
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setConfirmState(null);
                  void performRotate();
                }}
                style={styles.modalDeleteButton}
              >
                <Text style={styles.modalButtonText}>
                  {confirmState?.removingName
                    ? t("Sharing_member_remove_confirm_btn")
                    : t("Sharing_rotate_confirm_btn")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setConfirmState(null)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalButtonText}>{t("Common_cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MemberRow({
  name,
  peer,
  isAdmin,
  adminControls,
  statusLocked,
  onRemove,
}: {
  name: string;
  peer?: { status?: string };
  isAdmin?: boolean;
  adminControls?: boolean;
  statusLocked?: boolean;
  onRemove?: () => void;
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
  const color = status === "online" ? theme.success : theme.subTextColor;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
      }}
    >
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
      {statusLocked ? (
        <Lock
          size={14}
          color={theme.subTextColor}
          strokeWidth={2.5}
          style={{ marginRight: 2 }}
        />
      ) : (
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color }}>
          {label}
        </Text>
      )}
      {adminControls && onRemove && (
        <Pressable
          onPress={onRemove}
          style={{
            marginLeft: 10,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.dangerLight,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 11,
              color: theme.danger,
            }}
          >
            {t("Sharing_member_remove_btn")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    paragraph: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 21,
      color: theme.subTextColor,
      marginBottom: 18,
    },
    muted: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: theme.subTextColor,
      marginBottom: 16,
    },
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
    secondaryBtnText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: theme.accentColor,
    },
    dangerBtn: {
      borderWidth: 1,
      borderColor: theme.dangerLight,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: theme.dangerLight,
      marginTop: 8,
    },
    dangerBtnText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: theme.danger,
    },
    rotateBtn: {
      borderWidth: 1,
      borderColor: theme.warningDark,
      borderRadius: 16,
      paddingVertical: 13,
      alignItems: "center",
      backgroundColor: theme.warningLight,
      marginTop: 8,
    },
    rotateBtnText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: theme.warningDark,
    },
    rotateHint: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: theme.subTextColor,
      textAlign: "center",
      marginTop: 6,
      paddingHorizontal: 8,
      lineHeight: 16,
    },
    disabledCard: {
      alignItems: "center",
      padding: 20,
      borderRadius: 18,
      backgroundColor: theme.warningLight,
      borderWidth: 1,
      borderColor: theme.warningDark,
      marginBottom: 18,
    },
    disabledTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: theme.textColor,
      marginTop: 8,
      marginBottom: 6,
    },
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
    rowCardTitle: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: theme.textColor,
      marginBottom: 2,
    },
    rowCardSub: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: theme.subTextColor,
    },
    membersCard: {
      borderRadius: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.borderColor,
      paddingBottom: 6,
    },
    unlockRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    unlockRowText: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 13,
      color: theme.subTextColor,
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
    modalBackground: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modalBox: {
      width: "85%",
      backgroundColor: theme.cardBg,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: theme.textColor,
      textAlign: "center",
      marginBottom: 12,
    },
    modalText: {
      fontSize: 16,
      color: theme.subTextColor,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 22,
    },
    modalWarning: {
      backgroundColor: theme.dangerLight,
      borderColor: theme.danger,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
    },
    modalWarningText: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: theme.textColor,
      textAlign: "center",
      lineHeight: 20,
    },
    modalButtons: {
      flexDirection: "column",
      gap: 12,
    },
    modalDeleteButton: {
      flexGrow: 0,
      backgroundColor: theme.danger,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    modalCancelButton: {
      flexGrow: 0,
      backgroundColor: theme.cardBgSecondary,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    modalButtonText: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: theme.textColor,
    },
  });
