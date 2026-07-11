import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '../../src');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

describe('database access boundary (UT-4 / AC-2.3)', () => {
  it('only src/db/ imports the SQLite drivers', () => {
    const offenders = walk(SRC)
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith(path.join(SRC, 'db')))
      .filter((f) => {
        const src = fs.readFileSync(f, 'utf8');
        return /from ['"](expo-sqlite|better-sqlite3|drizzle-orm\/(expo-sqlite|better-sqlite3))['"]/.test(src);
      });
    expect(offenders).toEqual([]);
  });
});
