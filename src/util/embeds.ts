import { ContainerBuilder, TextDisplayBuilder } from "discord.js"

export const successEmbed = (description: string, title?: string) => {
  return new ContainerBuilder()
    .setAccentColor(0x49eb3d)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("## " + (title || ':white_check_mark: Success!')),
      new TextDisplayBuilder()
        .setContent(description)
    )
}

export const errorEmbed = (description: string, title?: string) => {
  return new ContainerBuilder()
    .setAccentColor(0xeb4949)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("## " + (title || ':x: Error')),
      new TextDisplayBuilder()
        .setContent(description)
    )
}