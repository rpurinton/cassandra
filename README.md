# Cassandra Drawing Prompt Bot

Cassandra is a Discord bot that generates creative drawing prompts for games, art jams, and group activities. It provides unique combinations of personality traits, hobbies, and random objects or animals to inspire fun and imaginative artwork.

---

## Features

- **/prompt Command:**
  - Instantly generates a drawing prompt consisting of:
    - A personality trait
    - A hobby
    - A random object, animal, or thing
  - Ensures prompts are unique and not recently repeated
  - Replies with a visually formatted embed for easy reading
  - Supports multiple languages for prompt labels (if locale files are present)

---

## Installation & Setup

1. **Clone the repository:**

   ```sh
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```

2. **Set up the MySQL database:**
   - Make sure you have MySQL installed and running.
   - Create a new database (e.g., `cassandra`).
   - Run the provided schema to create the required table:

     ```sh
     mysql -u <db_user> -p <db_name> < schema.sql
     ```

3. **Create your environment file:**
   - Copy `.env.example` to `.env` (if present), or create a new `.env` file:

     ```sh
     cp .env.example .env
     ```

   - Edit `.env` and set the following values:

     ```env
     LOG_LEVEL=info
     DISCORD_CLIENT_ID=your-discord-client-id
     DISCORD_TOKEN=your-discord-bot-token
     DB_HOST=localhost
     DB_USER=your-db-username
     DB_PASS=your-db-password
     DB_NAME=cassandra
     OPENAI_API_KEY=your-openai-api-key
     ```

4. **Install dependencies:**

   ```sh
   npm install
   ```

5. **Run the bot:**

   ```sh
   node cassandra.mjs
   ```

---

## Usage

- Use `/prompt` in your Discord server to receive a new drawing prompt.
- Each prompt is unique and designed to spark creativity for drawing games or challenges.

---

## License

MIT
