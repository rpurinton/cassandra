// Modern ES module, improved readability, and testability via dependency injection
import 'dotenv/config';
import path from 'path';
import db from '../db.mjs';
import log from '../log.mjs';
import { OpenAI } from 'openai';
import { readFile } from 'fs/promises';
import { getCurrentFilename } from '../esm-filename.mjs';

/**
 * Fetches recent prompts from the database.
 * @param {number} limit - Number of prompts to fetch.
 * @param {Object} options - Dependency injection options.
 * @param {Object} [options.dbLib=db] - Database library.
 * @param {Object} [options.logger=log] - Logger instance.
 * @returns {Promise<string[]>}
 */
export async function fetchRecent(limit = 100, { dbLib = db, logger = log } = {}) {
    try {
        const [rows] = await dbLib.query(
            'SELECT adjective, verb, noun FROM history ORDER BY id DESC LIMIT ?',
            [limit]
        );
        return rows.map(({ adjective, verb, noun }) => `${adjective}, ${verb}, ${noun}`);
    } catch (error) {
        logger.error('Error fetching recent prompts:', error);
        return [];
    }
}

/**
 * Stores a prompt in the database.
 * @param {string} adjective
 * @param {string} verb
 * @param {string} noun
 * @param {Object} options - Dependency injection options.
 * @param {Object} [options.dbLib=db] - Database library.
 * @param {Object} [options.logger=log] - Logger instance.
 * @returns {Promise<void>}
 */
export async function store(adjective, verb, noun, { dbLib = db, logger = log } = {}) {
    try {
        await dbLib.execute(
            'INSERT INTO history (adjective, verb, noun) VALUES (?, ?, ?)',
            [adjective, verb, noun]
        );
    } catch (error) {
        logger.error('Error storing prompt:', error);
    }
}

/**
 * Generates a prompt using OpenAI, including recent history.
 * @param {string} locale - The locale/language code to use for the AI response.
 * @param {Object} options - Dependency injection options.
 * @param {Object} [options.openaiLib] - OpenAI instance (default constructed from env).
 * @param {Object} [options.dbLib=db] - Database library.
 * @param {Object} [options.logger=log] - Logger instance.
 * @param {Function} [options.readFileFn=readFile] - File read function.
 * @param {Object} [options.pathLib=path] - Path library.
 * @param {Function} [options.getCurrentFilenameFn=getCurrentFilename] - Filename util.
 * @param {ImportMeta} [options.meta=import.meta] - import.meta for ESM compatibility.
 * @param {string} [options.configFileName='openai.json'] - Config file name.
 * @returns {Promise<[string, string, string]|null>}
 */
export async function generatePrompt(
    {
        locale,
        openaiLib,
        dbLib = db,
        logger = log,
        readFileFn = readFile,
        pathLib = path,
        getCurrentFilenameFn = getCurrentFilename,
        meta = import.meta,
        configFileName = 'openai.json',
        fetchRecentFn = fetchRecent,
        storeFn = store
    } = {}
) {
    // Ensure locale is always a non-empty string, fallback to 'en'
    const usedLocale = (typeof locale === 'string' && locale.trim()) ? locale : 'en-US';
    log.debug(`Generating prompt with locale: '${usedLocale}'`);
    if (!openaiLib) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key is not set. Please check your .env file.');
        }
        try {
            openaiLib = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        } catch (err) {
            logger.error('Failed to initialize OpenAI client:', err);
            throw new Error('Failed to initialize OpenAI client. Please check your configuration.');
        }
    }
    const __filename = getCurrentFilenameFn(meta);
    const __dirname = pathLib.dirname(__filename);
    const configPath = pathLib.join(__dirname, configFileName);
    let config;
    try {
        const data = await readFileFn(configPath, 'utf-8');
        config = JSON.parse(data);
    } catch (err) {
        logger.error('Failed to load OpenAI config:', err);
        throw err;
    }
    let usedPrompts = [];
    try {
        usedPrompts = await fetchRecentFn(100, { dbLib, logger });
    } catch (err) {
        logger.error('Failed to fetch history:', err);
    }

    // Inject locale into the user message
    if (config.messages && config.messages[0] && config.messages[0].content) {
        config.messages[0].content = config.messages[0].content.replace(
            '<USED_PROMPTS>',
            usedPrompts.join('\n')
        ) + `\nPlease generate the response words in language: ${usedLocale}`;
    }

    try {
        const completion = await openaiLib.chat.completions.create(config);
        const args = JSON.parse(completion.choices[0].message.function_call.arguments);
        const { personality_trait, hobby, object } = args;
        await storeFn(personality_trait, hobby, object, { dbLib, logger });
        return [personality_trait, hobby, object];
    } catch (error) {
        logger.error('OpenAI request failed:', error);
        return null;
    }
}