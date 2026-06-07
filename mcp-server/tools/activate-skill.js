import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';

const PLATFORM_DIR = join(homedir(), 'platform');

export default async function activateSkill({ projectName, skillName }) {
  // Airlock: never activate without explicit user confirmation.
  // This tool should only be called after the user has explicitly said "yes, activate X skill".
  // Claude Code must confirm with the user before calling this.

  try {
    const script = join(PLATFORM_DIR, 'scripts', 'activate-skill.sh');
    const output = execSync(`bash ${script} ${skillName} ${projectName}`, {
      cwd: PLATFORM_DIR,
      timeout: 15000,
      encoding: 'utf-8'
    });

    if (output.includes('ja està activada')) {
      return { ok: true, message: `La skill '${skillName}' ja estava activada al projecte '${projectName}'.`, alreadyActive: true };
    }

    if (output.includes('activada correctament')) {
      return { ok: true, message: `Skill '${skillName}' activada correctament al projecte '${projectName}'.`, alreadyActive: false };
    }

    if (output.includes('ERROR')) {
      return { ok: false, message: output.trim() };
    }

    return { ok: true, message: output.trim(), alreadyActive: false };
  } catch (e) {
    return { ok: false, message: `Error activant la skill: ${e.stderr || e.message}` };
  }
}
