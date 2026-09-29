import "expo-router/entry";

if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes(
        "dependencies should only be used in web implementation",
      )
    ) {
      return;
    }
    originalWarn(...args);
  };
}
