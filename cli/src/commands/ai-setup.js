import { select, input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { saveAIConfig, getAIConfig, removeAIConfig } from '../utils/local-store.js';
import { authState } from '../auth.js';

export async function setupAICmd() {
  const isDevMode = process.env.TASKIFIER_DEV_MODE === 'true' || process.env.NODE_ENV === 'development';
  if (isDevMode) {
    console.log(chalk.blue('\nDevelopment Mode Detected'));
    console.log(chalk.gray('Using AI configuration from local .env'));
    console.log(chalk.green('✓ AI Ready\n'));
    return;
  }

  const existingConfig = getAIConfig();
  if (existingConfig) {
    console.log(chalk.yellow(`\nAI is currently configured with ${existingConfig.provider}.`));
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: 'Keep current configuration', value: 'keep' },
        { name: 'Change AI Provider', value: 'change' },
        { name: 'Remove AI Configuration', value: 'remove' }
      ]
    });

    if (action === 'keep') return;
    if (action === 'remove') {
      removeAIConfig();
      console.log(chalk.green('\n✔ AI Configuration removed successfully.\n'));
      return;
    }
  } else {
    const enableAI = await select({
      message: 'Would you like to enable AI-powered work updates?',
      choices: [
        { name: 'Yes', value: true },
        { name: 'No (Continue without AI)', value: false }
      ]
    });

    if (!enableAI) {
      console.log(chalk.gray('\nContinuing without AI. Run `t ai setup` later to enable it.\n'));
      return;
    }
  }

  const provider = await select({
    message: 'Choose your AI Provider',
    choices: [
      { name: 'OpenRouter (Recommended)', value: 'openrouter' },
      { name: 'OpenAI', value: 'openai' },
      { name: 'Anthropic', value: 'anthropic' },
      { name: 'Google Gemini', value: 'gemini' },
      { name: 'Ollama (Local AI)', value: 'ollama' }
    ]
  });

  if (provider === 'openrouter') {
    console.log(chalk.gray('\nTaskifier recommends OpenRouter because it provides access to multiple AI models through a single API.'));
    console.log(chalk.gray('If you do not already have an API key, create an account on OpenRouter and generate one.'));
    console.log(chalk.gray('Once you have your API key, paste it below.\n'));
  }

  let apiKey = '';
  let model = '';

  if (provider === 'ollama') {
    model = await input({ message: 'Enter the local model name (e.g. llama3.1):' });
  } else {
    apiKey = await input({ message: `Enter your ${provider} API Key:` });
    
    // Choose model based on provider
    if (provider === 'openrouter') model = await input({ message: 'Enter the OpenRouter model name (e.g. openai/gpt-4o-mini):', default: 'openai/gpt-4o-mini' });
    if (provider === 'openai') model = await input({ message: 'Enter the OpenAI model name (e.g. gpt-4o-mini):', default: 'gpt-4o-mini' });
    if (provider === 'anthropic') model = await input({ message: 'Enter the Anthropic model name (e.g. claude-3-haiku-20240307):', default: 'claude-3-haiku-20240307' });
    if (provider === 'gemini') model = await input({ message: 'Enter the Gemini model name (e.g. gemini-1.5-flash):', default: 'gemini-1.5-flash' });
  }

  saveAIConfig({ provider, apiKey, model });
  console.log(chalk.green(`\n✔ AI Provider successfully set to ${provider}.\n`));
  
  const currentMode = authState.getMode();
  if (currentMode === 'personal' && !existingConfig) {
    console.log(chalk.blue.bold('\nWelcome to Taskifier Personal!'));
    console.log(chalk.gray('Available Commands:'));
    console.log(chalk.gray('  t start\n  t status\n  t update\n  t view-updates\n  t submit\n  t ai setup\n  t logout\n  t commands\n'));
  }
}
