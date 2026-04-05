import { resolveColor as djsResolve, Constants } from "discord.js";

export const resolveColor = (color: string): number | null => {
  if (!color.trim() || color.trim() === "" || color.trim().length !== 6) return null; // Default to null if empty

  const noHash = color.startsWith("#") ? color.slice(1) : color;
  if (noHash.length !== 6) return null; // Default to null if this isn't a hex code

  return djsResolve(parseInt(noHash, 16));
};

export const getRoleColorsObj = (
  color1: number | null,
  color2: number | undefined,
  holographic: boolean,
) => {
  return holographic
    ? {
        primaryColor: Constants.HolographicStyle.Primary,
        secondaryColor: Constants.HolographicStyle.Secondary,
        tertiaryColor: Constants.HolographicStyle.Tertiary,
      }
    : {
        primaryColor: color1!,
        secondaryColor: color2 ?? undefined,
      };
};
