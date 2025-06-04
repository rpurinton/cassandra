import { jest } from '@jest/globals';
import { fetchRecent, store, generatePrompt } from '../src/custom/openai.mjs';

const mockDb = {
    query: jest.fn(),
    execute: jest.fn()
};
const mockLogger = {
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
};
const mockReadFile = jest.fn();
const mockPath = {
    dirname: jest.fn(() => '/mockdir'),
    join: jest.fn((...args) => args.join('/'))
};
const mockGetCurrentFilename = jest.fn(() => '/mockdir/openai.mjs');

const mockOpenAI = function () {
    return {
        chat: {
            completions: {
                create: jest.fn()
            }
        }
    };
};

describe('openai.mjs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchRecent', () => {
        it('returns formatted prompts from db', async () => {
            mockDb.query.mockResolvedValueOnce([
                [
                    { adjective: 'brave', verb: 'run', noun: 'cat' },
                    { adjective: 'smart', verb: 'jump', noun: 'dog' }
                ]
            ]);
            const result = await fetchRecent(2, { dbLib: mockDb, logger: mockLogger });
            expect(result).toEqual(['brave, run, cat', 'smart, jump, dog']);
        });
        it('logs and returns [] on error', async () => {
            mockDb.query.mockRejectedValueOnce(new Error('fail'));
            const result = await fetchRecent(1, { dbLib: mockDb, logger: mockLogger });
            expect(result).toEqual([]);
            expect(mockLogger.error).toHaveBeenCalledWith('Error fetching recent prompts:', expect.any(Error));
        });
    });

    describe('store', () => {
        it('stores prompt in db', async () => {
            await store('happy', 'sing', 'bird', { dbLib: mockDb, logger: mockLogger });
            expect(mockDb.execute).toHaveBeenCalledWith(
                'INSERT INTO history (adjective, verb, noun) VALUES (?, ?, ?)',
                ['happy', 'sing', 'bird']
            );
        });
        it('logs error on db failure', async () => {
            mockDb.execute.mockRejectedValueOnce(new Error('fail'));
            await store('sad', 'cry', 'wolf', { dbLib: mockDb, logger: mockLogger });
            expect(mockLogger.error).toHaveBeenCalledWith('Error storing prompt:', expect.any(Error));
        });
    });

    describe('generatePrompt', () => {
        const config = {
            messages: [
                { content: 'Prompt history:\n<USED_PROMPTS>' }
            ],
            functions: [],
            function_call: { name: 'pick' }
        };
        it('generates prompt, stores result, returns values', async () => {
            mockReadFile.mockResolvedValueOnce(JSON.stringify(config));
            const usedPrompts = ['a, b, c'];
            const fetchRecentFn = jest.fn().mockResolvedValue(usedPrompts);
            const storeFn = jest.fn();
            const openai = mockOpenAI();
            openai.chat.completions.create.mockResolvedValueOnce({
                choices: [
                    { message: { function_call: { arguments: JSON.stringify({ personality_trait: 'kind', hobby: 'draw', object: 'pencil' }) } } }
                ]
            });
            const result = await generatePrompt({
                locale: 'fr',
                openaiLib: openai,
                dbLib: mockDb,
                logger: mockLogger,
                readFileFn: mockReadFile,
                pathLib: mockPath,
                getCurrentFilenameFn: mockGetCurrentFilename,
                configFileName: 'openai.json',
                fetchRecentFn,
                storeFn
            });
            expect(result).toEqual(['kind', 'draw', 'pencil']);
            expect(fetchRecentFn).toHaveBeenCalled();
            expect(storeFn).toHaveBeenCalledWith('kind', 'draw', 'pencil', expect.any(Object));
            expect(openai.chat.completions.create).toHaveBeenCalled();
            const calledConfig = openai.chat.completions.create.mock.calls[0][0];
            expect(calledConfig.messages[0].content).toMatch(/in language: fr/);
        });
        it('logs and throws if config file missing', async () => {
            mockReadFile.mockRejectedValueOnce(new Error('fail'));
            await expect(generatePrompt({
                locale: 'en',
                openaiLib: mockOpenAI(),
                dbLib: mockDb,
                logger: mockLogger,
                readFileFn: mockReadFile,
                pathLib: mockPath,
                getCurrentFilenameFn: mockGetCurrentFilename,
                configFileName: 'openai.json'
            })).rejects.toThrow();
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to load OpenAI config:', expect.any(Error));
        });
        it('logs and returns null on OpenAI error', async () => {
            mockReadFile.mockResolvedValueOnce(JSON.stringify(config));
            const openai = mockOpenAI();
            openai.chat.completions.create.mockRejectedValueOnce(new Error('fail'));
            const result = await generatePrompt({
                locale: 'es',
                openaiLib: openai,
                dbLib: mockDb,
                logger: mockLogger,
                readFileFn: mockReadFile,
                pathLib: mockPath,
                getCurrentFilenameFn: mockGetCurrentFilename,
                configFileName: 'openai.json'
            });
            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith('OpenAI request failed:', expect.any(Error));
        });
    });
});
