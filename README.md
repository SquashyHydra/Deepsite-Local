---
cuda 12: v1.48.0 (recommended)
tested models:
  - openai/gpt-oss-20b
  - qwen/qwen3-coder-30b
  - mistralai/codestral-22b-v0.1
---

# DeepSite 🐳

DeepSite is a coding platform powered by DeepSeek AI, designed to make coding smarter and more efficient. Tailored for developers, data scientists, and AI engineers, it integrates generative AI into your coding projects to enhance creativity and productivity.

## What's New

- **Local Project Publishing:**
  - Create and edit entirely on your local machine—no login required.
- **Local LM Studio Integration:**
  - Use local AI models (via LM Studio), with automatic model detection.

## Requirements

- [ MongoDB ](https://www.mongodb.com/try/download/community)
  - [ installation ](www.mongodb.com/docs/manual/administration/install-community/)
- [LM Studio](https://lmstudio.ai)
- [Node.js & npm](https://nodejs.org/en/download)

## How to use it locally
```bat
git clone https://github.com/SquashyHydra/Deepsite-Local.git
```
```bat
npm install
```
Create the `.env` and add the variables use the [development .env](https://github.com/SquashyHydra/Deepsite-Local/blob/main/.env) as an example
### development
```bat
npm run dev
```
### Build
```
npm run build
```
### Usage
```
npm run start
```

## LM Studio

Recommanded CUDA version CUDA 12 `v1.48.0`, When i updated to `v1.50.0` gpt oss 20b stopped working but qwen3 coder 30b still worked.

## MongoDB
When if you needed to use `monge+srv://` add it before the `MONGODB=localhost` .env variable like so `MONGODB=monge+srv://localhost`