export const genId = (() => {
  let count = 0;
  return () => {
    return (++count).toString();
  };
})();

export const prefersReducedMotion = (() => {
  // Cache result
  let shouldReduceMotion: boolean | undefined = undefined;

  return () => {
    if (shouldReduceMotion === undefined && typeof window !== "undefined") {
      const mediaQuery = matchMedia("(prefers-reduced-motion: reduce)");
      shouldReduceMotion = !mediaQuery || mediaQuery.matches;
    }
    return shouldReduceMotion;
  };
})();

export const getBackgroundColor = (type: string) => {
  switch (type) {
    case "info":
      return "rgba(50, 50, 50, 1)";
    case "success":
      return "rgba(46, 125, 50, 1)";
    case "error":
      return "rgba(211, 47, 47, 1)";
    case "warning":
      return "rgba(237, 108, 2, 1)";
    default:
      return "#fff";
  }
};
