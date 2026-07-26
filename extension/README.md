# Taskifier

> AI-powered developer productivity companion for VS Code.

## About

Taskifier is an intelligent engineering companion designed to eliminate the overhead of daily stand-ups and progress reporting. It helps developers:
* Track daily work seamlessly.
* Generate AI-enhanced work updates by automatically scanning Git commits.
* Generate beautiful daily summaries of completed work.
* Export daily reports to Markdown, PDF, or directly to Email.
* Improve engineering productivity by automating the busywork.

## Features

* **Personal Mode:** 100% offline, private tracking and reporting.
* **AI-Powered Summaries:** Transform raw technical commits into professional, manager-ready updates.
* **Git Commit Scanning:** Automatically scans your local repository for today's work.
* **Manual Work Updates:** Append blockers and tomorrow's plans easily.
* **Daily Report Generation:** Creates structured daily summaries automatically.
* **Multiple Exports:** Save as Markdown, generate PDFs, or send directly to your email client.
* **VS Code Sidebar Integration:** Quick access to your dashboard right in your editor.
* **Simple CLI Commands:** A powerful terminal interface (`t`) to control your workflow.

## Installation

1. Open VS Code.
2. Navigate to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Search for **Taskifier**.
4. Click **Install**.

## Quick Start

Getting started with Taskifier is incredibly easy. Open your terminal and run:

```text
t login
↓
Select Personal Mode
↓
t start
↓
t update
↓
t submit
```

## Commands

Taskifier offers a globally accessible CLI (`t`) to interact with your workspace:

| Command | Description |
| --- | --- |
| `t login` | Login to Taskifier |
| `t start` | Start a work session |
| `t update` | Generate work updates from your Git commits |
| `t view-updates` | View today's updates |
| `t submit` | Generate and export your daily report |
| `t ai setup` | Configure your local AI provider |
| `t logout` | Logout and clear your session |
| `t commands` | Display all available commands |

## AI Support

Taskifier allows you to bring your own AI to power your updates. You can configure your favorite AI provider using:

```bash
t ai setup
```

Supported Providers:
* OpenRouter
* OpenAI
* Anthropic
* Google Gemini
* Ollama (Local)

*Note: Your API keys remain securely stored on your local machine and are never uploaded.*

## Screenshots

Coming soon.

## Roadmap

* Organization Mode
* Team dashboards
* Manager reporting
* Attendance integration
* Advanced analytics
* Cloud synchronization

## Support

* [GitHub Issues](https://github.com/Taskifier/taskifier-vscode/issues)
* [Documentation](https://taskifier.com/docs)
* [Email Support](mailto:support@taskifier.com)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
