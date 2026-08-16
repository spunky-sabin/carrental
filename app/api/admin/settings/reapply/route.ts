import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { query } from '@/lib/db';
import { requireAdminUser } from '@/lib/owner';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'admin-settings.json');

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { allowReapply: false };
  }
}

async function writeSettings(data: any) {
  try {
    const dir = path.dirname(SETTINGS_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const access = await requireAdminUser();
  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const allowReapply = Boolean(body.allowReapply);
    const settings = { allowReapply };
    const ok = await writeSettings(settings);
    if (!ok) return NextResponse.json({ error: 'Failed to write settings' }, { status: 500 });

    if (body.migrateRejected) {
      // set allow_reapply = true for all previously rejected applications
      await query("ALTER TABLE owner_applications ADD COLUMN IF NOT EXISTS allow_reapply BOOLEAN DEFAULT false");
      await query("UPDATE owner_applications SET allow_reapply = true WHERE LOWER(application_status) = 'rejected'");
    }

    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
