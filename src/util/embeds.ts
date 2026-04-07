import {
  ContainerBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";

export const successEmbed = (description: string, title?: string) => {
  return new ContainerBuilder()
    .setAccentColor(0x49eb3d)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "## " + (title || ":white_check_mark: Success!"),
      ),
    )
    .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
};

export const errorEmbed = (description: string, title?: string) => {
  return new ContainerBuilder()
    .setAccentColor(0xeb4949)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## " + (title || ":x: Error")),
    )
    .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
};
