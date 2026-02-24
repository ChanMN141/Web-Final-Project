import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import ServicePost, { CATEGORIES } from '@/models/ServicePost';
import { getSession, unauthorizedResponse } from '@/lib/auth';

const CreatePostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
  budget: z.number().min(0, 'Budget must be a positive number'),
  requiredSkills: z.array(z.string()).optional(),
  location: z.object({
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    remote: z.boolean().optional(),
  }).optional(),
  milestones: z.array(z.object({
    title: z.string().min(1).max(100),
    amount: z.number().min(0),
    dueDate: z.string().optional(),
  })).optional(),
});

// GET /api/posts — paginated list of OPEN posts with all filters
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const skills = searchParams.get('skills'); // comma-separated skill IDs
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const remote = searchParams.get('remote');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10));

    const query: Record<string, unknown> = { status: 'OPEN' };

    if (category && CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (skills) {
      const skillIds = skills.split(',').filter(Boolean);
      if (skillIds.length > 0) query.requiredSkills = { $in: skillIds };
    }
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (country) query['location.country'] = { $regex: country, $options: 'i' };
    if (remote === 'true') query['location.remote'] = true;

    const skip = (page - 1) * limit;
    const total = await ServicePost.countDocuments(query);
    const posts = await ServicePost.find(query)
      .populate('userId', 'name email verifiedAt averageRating reviewCount')
      .populate('requiredSkills', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      posts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/posts — create post (Auth: SEEKER only)
export async function POST(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();
    if (session.role !== 'SEEKER') {
      return NextResponse.json({ success: false, error: 'Only Service Seekers can create posts' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const parseResult = CreatePostSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { title, description, category, budget, requiredSkills, location, milestones } = parseResult.data;

    const post = await ServicePost.create({
      userId: session.userId,
      title, description, category, budget,
      requiredSkills: requiredSkills ?? [],
      location: location ?? {},
      milestones: milestones?.map(m => ({
        ...m,
        dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
      })) ?? [],
    });

    const populated = await post.populate('requiredSkills', 'name category');
    return NextResponse.json({ success: true, post: populated }, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
