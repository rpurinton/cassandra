import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../../src/custom/openai.mjs', () => ({
  generatePrompt: jest.fn()
}));
jest.unstable_mockModule('../../src/log.mjs', () => ({
  default: { info: jest.fn(), error: jest.fn() }
}));
jest.unstable_mockModule('../../src/locales.mjs', () => ({
  getMsg: jest.fn((locale, key, fallback) => fallback)
}));

const { generatePrompt } = await import('../../src/custom/openai.mjs');
const log = (await import('../../src/log.mjs')).default;
const { getMsg } = await import('../../src/locales.mjs');

// Mock EmbedBuilder
class MockEmbedBuilder {
  setColor() { return this; }
  addFields() { return this; }
}
jest.unstable_mockModule('discord.js', () => ({
  EmbedBuilder: MockEmbedBuilder
}));
const { default: promptHandler } = await import('../../src/commands/prompt.mjs');

describe('prompt.mjs', () => {
  let interaction;
  beforeEach(() => {
    jest.clearAllMocks();
    interaction = {
      locale: 'en-US',
      deferReply: jest.fn(() => Promise.resolve()),
      reply: jest.fn(() => Promise.resolve()),
      editReply: jest.fn(() => Promise.resolve())
    };
  });

  it('replies with embed on success', async () => {
    generatePrompt.mockResolvedValue(['kind', 'draw', 'pencil']);
    await promptHandler(interaction);
    expect(interaction.deferReply).toHaveBeenCalled();
    expect(generatePrompt).toHaveBeenCalledWith({ locale: 'en-US' });
    expect(log.info).toHaveBeenCalledWith('Generated prompt: kind, draw, pencil');
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [expect.any(MockEmbedBuilder)] });
  });

  it('replies with error if generatePrompt throws', async () => {
    generatePrompt.mockRejectedValue(new Error('fail'));
    await promptHandler(interaction);
    expect(log.error).toHaveBeenCalledWith('Error generating prompt:', expect.any(Error));
    expect(interaction.reply).toHaveBeenCalledWith({ content: 'Failed to generate prompt' });
  });

  it('replies with error if generatePrompt returns null', async () => {
    generatePrompt.mockResolvedValue(null);
    await promptHandler(interaction);
    expect(log.error).toHaveBeenCalledWith('Failed to generate prompt');
    expect(interaction.reply).toHaveBeenCalledWith({ content: 'Failed to generate prompt' });
  });
});
