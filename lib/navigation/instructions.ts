export function getInstructionText(
  step: any,
  t: (key: string, opts?: any) => string,
): string {
  if (!step) return "";
  const type = step.maneuver?.type || "";
  const modifier = step.maneuver?.modifier || "";
  const name = step.name || "";

  if (type === "depart")
    return name
      ? t("Nav_instruction_depart_with_name", { name })
      : t("Nav_instruction_depart");
  if (type === "arrive") return t("Nav_instruction_arrive");
  if (type === "roundabout" || type === "rotary") {
    const exit = step.maneuver?.exit || 1;
    return t("Nav_instruction_roundabout", { exit });
  }
  if (type === "fork") {
    if (modifier === "left") return t("Nav_instruction_fork_left");
    if (modifier === "right") return t("Nav_instruction_fork_right");
    return t("Nav_instruction_fork");
  }
  if (type === "merge") return t("Nav_instruction_merge");
  if (type === "on ramp") {
    return name
      ? t("Nav_instruction_on_ramp_with_name", { name })
      : t("Nav_instruction_on_ramp");
  }
  if (type === "off ramp") {
    return name
      ? t("Nav_instruction_off_ramp_with_name", { name })
      : t("Nav_instruction_off_ramp");
  }
  if (type === "motorway_junction") {
    return name
      ? t("Nav_instruction_motorway_junction_with_name", { name })
      : t("Nav_instruction_motorway_junction");
  }
  if (type === "end of road") {
    if (modifier === "left") return t("Nav_instruction_end_of_road_left");
    if (modifier === "right") return t("Nav_instruction_end_of_road_right");
    return t("Nav_instruction_end_of_road_straight");
  }
  if (type === "turn" || type === "new name") {
    const dirText = t(`Nav_instruction_turn_${modifier}`, {
      defaultValue: modifier,
    });
    if (name) return t("Nav_instruction_turn_with_name", { dirText, name });
    return dirText;
  }
  if (type === "notification") {
    return name
      ? t("Nav_instruction_notification_with_name", { name })
      : t("Nav_instruction_notification");
  }
  return name || t("Nav_instruction_continue");
}
