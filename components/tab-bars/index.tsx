import React, { ReactNode } from "react";
import { TabTheme, AppThemeReturn } from "@/lib/theme";
import { TabBarModern } from "./TabBarModern";
import { TabBarNew } from "./TabBarNew";

type Props = {
  tabTheme: TabTheme;
  theme: AppThemeReturn;
  children: ReactNode;
};

export function TabBars({ tabTheme, theme, children }: Props) {
  switch (tabTheme) {
    case "modern":
      return <TabBarModern theme={theme}>{children}</TabBarModern>;
    case "new":
      return <TabBarNew>{children}</TabBarNew>;
    default:
      return <TabBarModern theme={theme}>{children}</TabBarModern>;
  }
}
