type PartOption = {
  label: string;
  value: string;
};

type PartCategory = {
  key: string;
  label: string;
  options: PartOption[];
};

const PART_CATEGORIES: PartCategory[] = [
  {
    key: "hair",
    label: "Hair",
    options: [
      { label: "Short", value: "short" },
      { label: "Medium", value: "medium" },
      { label: "Long", value: "long" },
      { label: "Bob Round", value: "bobRounded" },
      { label: "Bob Straight", value: "bobStraight" },
    ],
  },
  {
    key: "body",
    label: "Body",
    options: [
      { label: "Shirt", value: "shirt" },
      { label: "Sweater", value: "sweater" },
      { label: "T-Shirt", value: "tshirt" },
      { label: "Turtleneck", value: "turtleneck" },
    ],
  },
  {
    key: "eyes",
    label: "Eyes",
    options: [
      { label: "Boring", value: "boring" },
      { label: "Dots", value: "dots" },
      { label: "Open Circle", value: "openCircle" },
      { label: "Open Round", value: "openRounded" },
    ],
  },
  {
    key: "eyebrows",
    label: "Eyebrows",
    options: [
      { label: "Standard", value: "standard" },
      { label: "Angry", value: "angry" },
      { label: "Small", value: "small" },
    ],
  },
  {
    key: "mouth",
    label: "Mouth",
    options: [
      { label: "Smile", value: "smile" },
      { label: "Big Smile", value: "bigSmile" },
      { label: "Laugh", value: "laugh" },
      { label: "Flat", value: "flat" },
      { label: "Half Open", value: "halfOpen" },
      { label: "Frown", value: "frown" },
      { label: "Nervous", value: "nervous" },
    ],
  },
  {
    key: "nose",
    label: "Nose",
    options: [
      { label: "Dots", value: "dots" },
      { label: "Big", value: "big" },
      { label: "Curve", value: "curve" },
      { label: "Half Oval", value: "halfOval" },
    ],
  },
  {
    key: "faceHair",
    label: "Face Hair",
    options: [
      { label: "None", value: "none" },
      { label: "Beard", value: "beard" },
    ],
  },
];

const HAIR_COLORS = [
  "#1a1a1a",
  "#4a3728",
  "#6b4226",
  "#8b4513",
  "#d4a574",
  "#e8c9a0",
  "#c0392b",
  "#b0b0b0",
  "#f0f0f0",
  "#2980b9",
  "#e91e90",
  "#8e44ad",
];

const BODY_COLORS = [
  "#ffffff",
  "#1a1a1a",
  "#808080",
  "#e74c3c",
  "#3498db",
  "#27ae60",
  "#f1c40f",
  "#9b59b6",
  "#e91e63",
  "#e67e22",
  "#2c3e50",
  "#1abc9c",
];

const SKIN_COLORS = [
  "#fde8d0",
  "#f5d0b0",
  "#e8b890",
  "#d4a078",
  "#c49a6c",
  "#b8875e",
  "#9d7a54",
  "#7a5a3e",
  "#5a3e28",
  "#3e2a1a",
];

const BG_COLORS = [
  "#ffffff",
  "#f0f0f0",
  "#e0e0e0",
  "#2c3e50",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#e8f4f8",
  "#f0e6d3",
];

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function generateRandomAvatarConfig(): Record<string, string> {
  const config: Record<string, string> = {};
  for (const cat of PART_CATEGORIES) {
    config[cat.key] = pick(cat.options).value;
  }
  config.accessories = "none";
  config.hats = "none";
  config.hairColor = pick(HAIR_COLORS);
  config.bodyColor = pick(BODY_COLORS);
  config.headColor = pick(SKIN_COLORS);
  config.earsColor = config.headColor;
  config.backgroundColor = pick(BG_COLORS);
  return config;
}
