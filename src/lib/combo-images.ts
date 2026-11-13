export interface ComboPackImageAsset {
  src: string;
  alt: string;
  attribution?: {
    name: string;
    source: string;
    license: string;
    licenseUrl: string;
  };
}

type ComboPackImageDefinition =
  | { assetId: string }
  | { src: string; alt: string };

export const COMBO_PACK_IMAGES: Record<string, ComboPackImageDefinition> = {
  "jamui-heritage-hill-stay-combo": {
    assetId: "simultala-hill-station",
  },
  "grand-wedding-reception-combo": {
    src: "/partners/events/genx_brij/hall.png",
    alt: "Banquet hall at GenX Brij in Jamui",
  },
  "simultala-jain-circuit-heritage-trail": {
    assetId: "lachhuar-jain-mandir",
  },
  "patna-airport-jamui-railway-connect-stay": {
    src: "/partners/events/genx_brij/cafe.png",
    alt: "Dining area at GenX Brij in Jamui",
  },
  "spiritual-bihar-discovery-expedition": {
    assetId: "mahabodhi-temple",
  },
  "bodh-gaya-spiritual-tour": {
    assetId: "mahabodhi-temple",
  },
  "nalanda-rajgir-heritage-combo": {
    assetId: "nalanda-ruins",
  },
};

export function resolveComboPackImage(
  slug: string,
  tourismAssets: Record<string, ComboPackImageAsset>
): ComboPackImageAsset | undefined {
  const definition = COMBO_PACK_IMAGES[slug];
  if (!definition) return undefined;
  if ("assetId" in definition) return tourismAssets[definition.assetId];
  return definition;
}
