# ATLASYS – PRIVACY POLICY

Last updated: September 2026 · Version 1.2
Controller: Cactus Apps · cactus_apps@proton.me
Open Source: github.com/Cactus-Apps/Atlasys

### SCOPE

This Privacy Policy describes what personal data is processed by the Atlasys
mobile app ("App"), for which purposes, on which legal basis, and what rights
you have as a data subject under the General Data Protection Regulation (GDPR).

Atlasys is fully open source. The complete source code is available at
github.com/Cactus-Apps/Atlasys. There are no hidden data collections, ad SDKs,
or trackers in the App.

## 1. WHAT DATA WE PROCESS

Depending on how you use the App, we may process the following categories:

• Identification data: Email address (required for account creation).
• Account data: Profile information, account ID.
• Usage data: Anonymous usage statistics via PostHog, only with your explicit
consent given during onboarding.
• Connection data: Login timestamps, IP address (temporary, not stored
persistently).
• Proof of consent: Timestamp and version of your acceptance of our Terms of
Service and Privacy Policy, stored as required by Art. 7 GDPR.

## 2. LOCATION DATA

The App requests access to your GPS location to center the map and provide
navigation features.

#### Important:

• Your precise location is processed only on your device.
• We do not store your location in our database.
• We do not log, track, or share your location history with any third party.
• Your location never leaves your device except as described below for routing.

For route calculation, start and destination coordinates are sent to OSRM
(routing.openstreetmap.de), an open-source routing server. These coordinates
are transmitted without any identifier linking them to your account or identity.

For approximate country-level positioning on first launch (before GPS is ready),
a one-time request is made to ipapi.co using your IP address. No personal data
beyond the IP is transmitted, and the result is used only to set an initial map
center on your device.

Location permission is requested via the standard system prompt. You can revoke
this permission at any time in your device settings.

### 2a. LIVE LOCATION SHARING (FAMILY SHARING)

Atlasys also offers an optional "live location sharing" feature for families.
It is built so that we cannot see what is being shared — even if our database
or servers were fully compromised:

• **End-to-end encryption.** Coordinates are encrypted on the sender's device
using established, audited cryptography (TweetNaCl: X25519 + XSalsa20-Poly1305
with Ed25519 signatures). They can only be decrypted on the recipients'
devices. We never hold decryption keys.

• **No location database and no group database.** Shared positions travel as
_ephemeral_ realtime broadcast messages through our relay. Nothing is stored,
there are no database rows, and messages are deleted by the system as they are
delivered. "Position" and "sharing ended" messages are deliberately identical
in size so that not even a passive observer can tell them apart.

• **No server-visible membership.** The family roster (who belongs to a family
and their device public keys) exists only on the involved devices. It is
established out-of-band by scanning QR codes in person — the same model
messenger apps use to link a device. Invite codes contain no material that
could decrypt anything.

• **No history, no timestamps.** We do not keep location history, and the app
does not display any "seen X minutes ago" information. If a device goes
offline, every other family device simply infers this from the absence of
position signals and shows the last position without any time indication.

• **Device protection while sharing.** While live sharing is active, the map
view is gated behind biometric authentication (Face ID / fingerprint) and
screenshots plus the app-switcher preview are blocked.

• **Remote safety switch.** We can temporarily disable live location sharing
for all users through an operator-only configuration flag (a "kill switch").
This does not give us any ability to read locations — it only stops the feature
until the flag is cleared. When the switch is pulled, active shares are ended
and affected users are informed inside the app with a notice that explains why
and how to contact support.

• **Background delivery.** While a share is active, the app may run an
Android foreground-service notification and an iOS background-location
indicator so that encrypted positions keep flowing after the app leaves the
foreground. That notice only states that sharing is active — coordinates
never appear in it, and you can stop sharing at any time to remove it.

• **Honest limitation.** A relay-based system cannot hide that _some_ network
traffic exists, at what time it occurs, or over which IP it flows.
Infrastructure-level logs (load balancers, hosting providers, network
operators) may therefore observe connection metadata — but they can never
link that traffic to a person or to a location: channel names are unguessable
secrets derived from the encryption key, and coordinates never appear in
cleartext outside the participating devices. We deliberately describe this as
"no server ever sees plaintext locations", not as "zero metadata" — no such
claim is made.

## 3. LEGAL BASES (GDPR ART. 6)

• Contract performance (Art. 6(1)(b)): Providing your account and core app
functionality.
• Consent (Art. 6(1)(a)): Location access, daily ping (PostHog), and crash
reporting preferences chosen during onboarding. You may withdraw consent at
any time in the app settings.
• Legitimate interests (Art. 6(1)(f)): Security logs, fraud prevention, and
anonymous crash reporting to maintain app stability. These interests are
balanced against your rights and do not override them.
• Legal obligation (Art. 6(1)(c)): Retention of consent records and compliance
with applicable law.

## 4. THIRD-PARTY SERVICES AND DATA PROCESSORS

Atlasys uses the following external services. Where a data processing agreement
is required under GDPR, one is in place.

• Supabase (authentication, database, and storage)
Data stored in the EU (Frankfurt). A data processing agreement is in place.
Privacy policy: supabase.com/privacy

• PostHog (usage daily ping, only with your consent)
You choose the level of daily ping, or none.
Privacy policy: posthog.com/privacy

• OpenFreeMap / OpenStreetMap (map tiles)
Anonymous tile requests. No personal data transmitted.
openfreemap.org / openstreetmap.org

• OSRM – routing.openstreetmap.de (route calculation)
Start and destination coordinates transmitted without any identity data.

• Nominatim – nominatim.openstreetmap.org (reverse geocoding)
Coordinates only. No personal data transmitted.

• Wikipedia API (city information)
No personal data transmitted.

• Open-Meteo (weather data, if used)
Coordinates only. No personal data transmitted.

• ipapi.co (approximate country location on first launch)
Your IP address is used once to determine approximate country. Not stored.

#### What we do NOT do:

• We do not sell your data.
• We do not show ads.
• We do not build a behavioral profile about you.
• We do not share your location history with anyone.
• We do not store, log, or retain shared live locations at any point.

## 5. RETENTION PERIODS

• Account data: Retained as long as your account is active or as required by
applicable law. Deleted within 30 days of an account deletion request.
• Security and connection logs: Retained for a limited time for debugging and
security purposes, then deleted.
• Proof of consent: Retained as long as required to demonstrate compliance or
until you withdraw consent.
• Local app data (offline maps, settings): Stored only on your device. Deleted
when you uninstall the app or clear app data.
• Live location sharing: Nothing is retained. Realtime broadcast messages are
transient and are not stored; the family roster and device keys exist only in
the device's secure keychain and are deleted when you leave a family or delete
your account. No location data is ever written to our database.

## 6. INTERNATIONAL DATA TRANSFERS

Account data is stored on Supabase servers in the EU (Frankfurt region). Where
data is transferred outside the EU/EEA by a processor,
this is done on the basis of appropriate safeguards such as an adequacy decision
by the European Commission or EU Standard Contractual Clauses (SCCs).

## 7. YOUR RIGHTS UNDER GDPR

Under the GDPR you have the following rights:

• Access (Art. 15): Request a copy of your personal data.
• Rectification (Art. 16): Correct inaccurate data.
• Erasure (Art. 17): Request deletion of your data ("right to be forgotten").
• Restriction of processing (Art. 18): Limit how we use your data.
• Data portability (Art. 20): Receive your data in a machine-readable format.
• Object (Art. 21): Object to processing based on legitimate interests.
• Withdraw consent (Art. 7(3)): Withdraw any consent at any time, without
affecting the lawfulness of processing before withdrawal.

To exercise any of these rights, contact us at: cactus_apps@proton.me
We will respond within 30 days.

You also have the right to lodge a complaint with your national data protection
supervisory authority. In Germany this is the relevant Landesbeauftragter für
Datenschutz of your federal state, or the Bundesbeauftragte für den Datenschutz
und die Informationsfreiheit (BfDI).

## 8. DATA BREACH NOTIFICATION

In the event of a personal data breach, we will notify the competent supervisory
authority within 72 hours where required by Art. 33 GDPR. Affected users will be
informed without undue delay if there is a high risk to their rights and freedoms
(Art. 34 GDPR).

## 9. CHILDREN'S PRIVACY

Atlasys is not directed at children under the age of 13(in germany 18). We do
not knowingly collect personal data from children. If you believe a child has
provided us withpersonal data, please contact us at cactus_apps@proton.me and
we will delete it.

## 10. CHANGES TO THIS POLICY

We may update this Privacy Policy for legal or technical reasons. The current
version is always available in the App and at github.com/Cactus-Apps/Atlasys.

For material changes we will notify you via the in-app announcements system and,
where required by law, ask for your renewed consent.

Continued use of the App after a non-material update constitutes acceptance of
the revised policy.

## CONTACT

Cactus Apps
Email: cactus_apps@proton.me
GitHub: github.com/Cactus-Apps/Atlasys

##### Last updated: September 2026 · Version 1.2
