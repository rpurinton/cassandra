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

2. **Create your environment file:**
   - Copy `.env.example` to `.env` (if present), or create a new `.env` file:

     ```sh
     cp .env.example .env
     ```

   - Edit `.env` and set your Discord bot token and client ID:

     ```env
     DISCORD_TOKEN=your-app-token
     DISCORD_CLIENT_ID=your-client-id
     LOG_LEVEL=info
     ```

3. **Install dependencies:**

   ```sh
   npm install
   ```

4. **Run the bot:**

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
