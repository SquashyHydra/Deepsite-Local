---
cuda 12: v1.48.0 (recommended)
tested models:
  - openai/gpt-oss-20b
  - qwen/qwen3-coder-30b
  - mistralai/codestral-22b-v0.1
---

# DeepSite 🐳

DeepSite-Local is a modern, privacy-friendly coding platform designed for seamless local project development. It empowers you to create, edit, and manage projects entirely on your own machine—no cloud integration, no required login, and no built-in cloud AI. With support for image uploads and optional local LM Studio integration, DeepSite gives you full control over your workflow and data, making it ideal for offline use and local-first development.

### 📜 Original Project
  - [enzostvs/deepsite](https://huggingface.co/spaces/enzostvs/deepsite/tree/main)


## ✨ Features

- **Local Project Publishing:**
  - Create and edit entirely on your local machine—no login required.
- **Image Upload (Beta):**
  - Upload images to your projects (local).
- **Local LM Studio Integration:**
  - Use local AI models (via LM Studio) for chat and code generation, with automatic model detection.
- **UI:**
  - UI Changes for local project management.

## 🚧 Roadmap / Known Limitations

- **Image Persistence & AI Usage:**
  - Images uploaded to a project do not persist after reloading the project.
  - Uploaded images are not yet fed into the AI assistant prompt.
- **Loading Existing Projects:**
  - Seamless loading of existing projects is coming soon.
  - For now, to load a project: create a default project with a name, find the folder in `/public/[displayname]/[encodedname]`, and replace the files inside that folder with your own.
- **General Improvements:**
  - Discuss more in the [discussions](#-stay-updated)

## 🛠 Requirements

- [MongoDB](https://www.mongodb.com/try/download/community)
  - [Installation Guide](https://www.mongodb.com/docs/manual/administration/install-community/)
- [LM Studio](https://lmstudio.ai)
- [Node.js & npm](https://nodejs.org/en/download)

## 🚀 Getting Started

Clone the repository:
```bat
git clone https://github.com/SquashyHydra/Deepsite-Local.git
```
Install dependencies:
```bat
npm install
```
Create a `.env` file and add the required variables. Use the [development .env](https://github.com/SquashyHydra/Deepsite-Local/blob/main/.env) as an example.

### Development
```bat
npm run dev
```
### Build
```bat
npm run build
```
### Start
```bat
npm run start
```

## ⚡ LM Studio Notes

- Recommended CUDA version: CUDA 12 `v1.48.0`.
- When updating to `v1.50.0`, `gpt-oss-20b` may stop working, but `qwen3-coder-30b` still works.

## 🗄️ MongoDB Notes

- If you need to use `mongodb+srv://`, add it before the `MONGODB=localhost` variable in your `.env` file, like so: `MONGODB=mongodb+srv://localhost`.

## 🧑‍💻 Troubleshooting

- **Images not persisting:** This is a known limitation; see Roadmap above.
- **Project loading issues:** Use the manual folder method described above until seamless loading is released.
- **Model/Provider not available:** Ensure LM Studio is running and the model is loaded.
- **Other issues:** Please open an issue or discussion on GitHub.

## 📅 Stay Updated

- Follow [this discussion](https://github.com/SquashyHydra/Deepsite-Local/discussions) for the latest updates, tips, and troubleshooting.

---

MIT License