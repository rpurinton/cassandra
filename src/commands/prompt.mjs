import log from '../log.mjs';
import { getMsg } from '../locales.mjs';
import { EmbedBuilder } from 'discord.js';
import { generatePrompt } from '../custom/openai.mjs';

// Command handler for /prompt
export default async function (interaction) {
    await interaction.deferReply();
    const locale = interaction.locale || 'en-US';
    let result;
    try {
        result = await generatePrompt({ locale });
    } catch (err) {
        log.error('Error generating prompt:', err);
        await interaction.reply({ content: getMsg(locale, 'prompt_error', 'Failed to generate prompt') });
        return;
    }
    if (!result) {
        log.error('Failed to generate prompt');
        await interaction.reply({ content: getMsg(locale, 'prompt_error', 'Failed to generate prompt') });
        return;
    }
    const [trait, hobby, object] = result;
    const embed = new EmbedBuilder()
        .setColor('#ff69b4')
        .addFields(
            { name: getMsg(locale, 'trait', 'Trait'), value: trait, inline: true },
            { name: getMsg(locale, 'hobby', 'Hobby'), value: hobby, inline: true },
            { name: getMsg(locale, 'object', 'Object'), value: object, inline: true }
        );
    log.info(`Generated prompt: ${trait}, ${hobby}, ${object}`);
    await interaction.editReply({ embeds: [embed] });
}
