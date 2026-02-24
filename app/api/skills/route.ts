import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Skill, { SKILL_SEEDS, SKILL_CATEGORIES } from '@/models/Skill';

// GET /api/skills — list all skills grouped by category (auto-seeds if empty)
export async function GET() {
  try {
    await connectToDatabase();

    let count = await Skill.countDocuments();

    // Auto-seed on first call
    if (count === 0) {
      await Skill.insertMany(SKILL_SEEDS, { ordered: false }).catch(() => {});
      count = await Skill.countDocuments();
    }

    const skills = await Skill.find().sort({ category: 1, name: 1 }).lean();

    // Group by category preserving order
    const grouped = SKILL_CATEGORIES.map(cat => ({
      category: cat,
      skills: skills.filter(s => s.category === cat),
    })).filter(g => g.skills.length > 0);

    return NextResponse.json({ success: true, skills, grouped, total: count });
  } catch (error) {
    console.error('GET /api/skills error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
