# Contributing to Atlasys

Thanks for your interest in contributing to Atlasys! Atlasys is a privacy-first, open-source map app built with React Native and Expo. Every contribution — whether it's a bug report, a fix, a feature, or improved documentation — is welcome.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [License](#license)

---

## Code of Conduct

Be respectful. Constructive criticism is welcome; personal attacks are not. We want this to be a project where everyone feels comfortable contributing.

---

## Ways to Contribute

You don't have to write code to contribute. Here are some ways to help:

- **Report a bug** — open a GitHub Issue with steps to reproduce
- **Fix a bug** — pick an open issue and submit a pull request
- **Improve documentation** — fix typos, clarify explanations, translate strings
- **Add or improve translations** — see the `i18n` folder
- **Suggest a feature** — open an Issue with the `feature request` label
- **Improve map data** — Atlasys uses OpenStreetMap; editing OSM directly benefits all OSM-based apps including Atlasys (openstreetmap.org)
- **Test on your device** — report edge cases, unexpected behavior, or performance issues
- **Or, if you're good at UI/UX, feel free to improve the app—I'm just a mobile developer, not a UX/UI designer. I'd really appreciate that.**

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android builds) or Xcode (for iOS builds)
- A physical device or emulator

### Setup

```bash
# Clone the repository
git clone https://github.com/Cactus-Apps/Atlasys.git
cd Atlasys

# Install dependencies
npm install

# Copy the environment template and fill in your values
cp .env.example .env.local

# Start the development server
npx expo start
```

### Environment Variables

The app requires a few external services to run fully. For most contributions
(UI, navigation logic, offline maps) you only need the map-related variables.
Supabase, Sentry, and RevenueCat keys are only needed if you are working on
auth, crash reporting, or premium features.

See `.env.example` for the full list.

---

## Project Structure

```
Atlasys/
├── app/                  # Expo Router screens
│   ├── (tabs)/           # Main tab screens
│   ├── auth/             # Auth screens
│   ├── (legal)/          # Privacy policy, Terms of Use
│   └── onboarding.tsx    # Onboarding flow
├── assets/               # Assets for android
│   ├── animations/       # Animations
│   └── images/           # Icons, Previews
├── components/           # Reusable UI components
│   └── sheets_modal/     # Bottom sheets and modals
│   ├── overlays/         # Littel ui components
│   └── auth/             # UI components for auth
├── lib/                  # Business logic and utilities
│   ├── auth/             # Supabase auth context
│   ├── config/           # Posthig config
│   ├── geocoding/        # Geocoding-logic and utilities
│   ├── logs/             # Map logs
│   ├── storage/          # Zustand store
│   ├── update/           # Update logic, hooks
│   └── theme.ts          # Theme tokens
├── locals/               # Translation files
└── utils/                # External API wrappers
```

---

## Development Workflow

1. **Fork** the repository and create a branch from `main`:

   ```bash
   git checkout -b fix/your-description
   # or
   git checkout -b feat/your-description
   ```

2. **Make your changes.** Keep commits small and focused on one thing.

3. **Test your changes** on a real device if possible — especially anything
   touching maps, location, or offline functionality.

4. **Check TypeScript** — the project uses strict TypeScript:

   ```bash
   npx tsc --noEmit
   ```

5. **Commit** with a clear message:
   ```
   fix: correct POI click offset on scaled displays
   feat: add walking route profile icon
   docs: clarify offline map download instructions
   ```
   We loosely follow [Conventional Commits](https://www.conventionalcommits.org).

---

## Submitting a Pull Request

- Open your PR against the `main` branch.
- Describe **what** you changed and **why**.
- Reference any related issues with `Fixes #123` or `Relates to #456`.
- Keep PRs focused — one fix or feature per PR makes review much easier.
- Screenshots or screen recordings are very helpful for UI changes.

A maintainer will review your PR as soon as possible. We may ask for changes
or clarification before merging.

---

## Reporting Bugs

Please open a [GitHub Issue](https://github.com/Cactus-Apps/Atlasys/issues/new)
and include:

- A clear title and description
- Steps to reproduce the bug
- Expected vs. actual behavior
- Your device model and Android/iOS version
- App version (visible in the profile screen)
- Relevant logs or screenshots if available

For security vulnerabilities, please **do not** open a public issue. Email us
directly at cactus_apps@proton.me.

---

## Requesting Features

Open a [GitHub Issue](https://github.com/Cactus-Apps/Atlasys/issues/new) with
the label `feature request`. Describe:

- What problem the feature would solve
- How you imagine it working
- Any alternatives you have considered

We can't promise every request will be implemented, but all suggestions are
read and considered.

---

## License

By contributing to Atlasys you agree that your contributions will be licensed
under the same license as the project: **GNU General Public License v3.0 (GPLv3)**.

This means your code can be freely used, modified, and distributed for
non-commercial purposes. Commercial use of Atlasys as a product requires a
separate license from Cactus Apps.

See [LICENSE](./LICENSE) for the full license text.

---

Questions? Reach out at cactus_apps@proton.me or open an Issue.
