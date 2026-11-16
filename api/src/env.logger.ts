import { join } from 'path';
// see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '../../.env') });

const env = process.env;

/**
 * Checks for the presence of critical environment variables and logs warnings if any are missing.
 * This function logs a warning if `TR_SECRET` is not set (a random per-process secret is then used) or looks weak.
 * This helps ensure that necessary environment variables are defined for security and configuration purposes.
 */
export function checkEnvVariables() {
  // Check TR_SECRET
  if (!env.TR_SECRET) {
    console.warn(
      'TR_SECRET not set. A random secret is used for this process, so sign-ins will not survive a restart. Set TR_SECRET to a unique random value (e.g. `openssl rand -hex 32`); it is required in production.',
    );
  } else if (env.TR_SECRET.length < 32) {
    console.warn('TR_SECRET is shorter than 32 characters. Please use a unique random value, e.g. the output of `openssl rand -hex 32`.');
  }
}
