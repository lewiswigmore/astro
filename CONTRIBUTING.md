# Contributing to KQL Missions

First off, thanks for taking the time to contribute! 🎉

The goal of this project is to make learning KQL (Kusto Query Language) fun, interactive, and accessible through a gamified "Space Mission" interface.

## 🛠️ Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/astro.git
   cd astro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The site will be available at `http://localhost:4321/astro/`.

## 🚀 Creating a New Mission

Missions are content-driven and live in `src/content/docs/`.

1. **Create a Mission Folder**
   Create a new folder in `src/content/docs/` (e.g., `mission-05`).

2. **Add Mission Files**
   Create `.mdx` files for each step of the mission.
   * `introduction.mdx`: The briefing.
   * `step-01.mdx`: The first challenge.

3. **Frontmatter Format**
   Each MDX file needs specific frontmatter:

   ```yaml
   ---
   title: "Mission 05: The Lost Signal"
   description: "Track down a signal using time-series analysis."
   order: 1
   ---
   ```

4. **Using Components**
   You can use the built-in components in your MDX:

   ```jsx
   import Holodeck from '../../../components/Holodeck';

   <Holodeck 
     initialCode="// Write your query here"
     title="Signal Analysis Console"
   />
   ```

## 🐛 Reporting Bugs

If you find a bug, please create an issue using the **Bug Report** template. Include as much detail as possible, including browser version and reproduction steps.

## 💡 Feature Requests

Have an idea for the platform? Use the **Feature Request** template to share your ideas!
