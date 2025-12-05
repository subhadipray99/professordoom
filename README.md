# 🎃 Professor Doom - Resume Roaster

> *"I've seen thousands of resumes... most belong in a graveyard."* - Professor Doom

A spooky, AI-powered resume analyzer that roasts your CV with dark humor while providing genuinely helpful career advice. Built for the **Kiroween Hackathon 2025**.

![Professor Doom](public/professor.png)

## 🦇 Features

### Core Analysis
- **🔥 Brutal Roasts** - Get your resume torn apart with dark humor
- **🤖 AI Replacement Risk** - Find out if robots are coming for your job
- **🛡️ Futureproof Score** - How resilient is your career?
- **📈 What to Improve** - Actionable improvement tips
- **💼 Eligible Jobs** - Jobs you're actually qualified for

### Interactive Features
- **🕯️ Confession Booth** - Confess resume exaggerations, get redemption tips
- **🎙️ Summary Room** - Get a positive voice introduction (unlocks after 3 chats)
- **📚 Learning Crypt** - Find courses to improve your skills (powered by Exa.ai)
- **📈 Skill Trends** - Discover trending skills in your industry (powered by Exa.ai)

### Voice & Audio
- **Horror Voice** - ElevenLabs text-to-speech with spooky voice
- **Per-section Audio** - Play audio for any response
- **Downloadable Summaries** - Save your introduction as MP3

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **AI Brain:** Google Gemini API (gemini-2.0-flash)
- **Voice:** ElevenLabs API (eleven_multilingual_v2)
- **Search:** Exa.ai API (neural search)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **PDF Parsing:** pdf-parse
- **Deployment:** Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- API Keys for: Gemini, ElevenLabs, Exa.ai

### Installation

```bash
# Clone the repo
git clone https://github.com/subhadipray99/professordoom.git
cd professordoom

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the server
npm start
```

Visit `http://localhost:3000`

## 🔑 Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
EXA_API_KEY=your_exa_api_key
PORT=3000
```

## 📁 Project Structure

```
professordoom/
├── .kiro/                    # Kiro IDE configuration
│   ├── specs/               # Feature specifications
│   ├── hooks/               # Agent hooks
│   └── steering/            # AI personality & guidelines
├── api/                     # Vercel serverless functions
├── public/                  # Frontend assets
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js               # Express server (local dev)
└── package.json
```

## 🎃 Kiroween Hackathon

This project was built for the [Kiroween Hackathon](https://kiroween.devpost.com/) using Kiro IDE.

### Kiro Features Used
- **Specs** - Structured feature development with requirements, design, and tasks
- **Steering** - Custom AI personality rules for Professor Doom
- **Hooks** - Automated reminders and checks

## 📜 License

MIT License - See [LICENSE](LICENSE) file

## 👻 Credits

- Built with [Kiro IDE](https://kiro.dev)
- AI powered by [Google Gemini](https://ai.google.dev/)
- Voice by [ElevenLabs](https://elevenlabs.io/)
- Search by [Exa.ai](https://exa.ai/)

---

*Enter if you dare... 💀*
