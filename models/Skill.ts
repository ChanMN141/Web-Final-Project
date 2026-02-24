import mongoose, { Schema, Document, Model } from 'mongoose';

export const SKILL_CATEGORIES = [
  'Frontend', 'Backend', 'Mobile', 'Database',
  'DevOps & Cloud', 'Design', 'Data Science', 'Other',
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];

export interface ISkill extends Document {
  name: string;
  category: SkillCategory;
}

const SkillSchema: Schema<ISkill> = new Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
  category: { type: String, required: true, enum: SKILL_CATEGORIES },
});

SkillSchema.index({ category: 1, name: 1 });

const Skill: Model<ISkill> =
  mongoose.models.Skill || mongoose.model<ISkill>('Skill', SkillSchema);

export const SKILL_SEEDS: { name: string; category: SkillCategory }[] = [
  { name: 'React', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Svelte', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'JavaScript', category: 'Frontend' },
  { name: 'HTML/CSS', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express.js', category: 'Backend' },
  { name: 'Python', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Ruby on Rails', category: 'Backend' },
  { name: 'Laravel', category: 'Backend' },
  { name: 'Java', category: 'Backend' },
  { name: 'C#/.NET', category: 'Backend' },
  { name: 'Go', category: 'Backend' },
  { name: 'Rust', category: 'Backend' },
  { name: 'GraphQL', category: 'Backend' },
  { name: 'React Native', category: 'Mobile' },
  { name: 'Flutter', category: 'Mobile' },
  { name: 'Swift', category: 'Mobile' },
  { name: 'Kotlin', category: 'Mobile' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MySQL', category: 'Database' },
  { name: 'Redis', category: 'Database' },
  { name: 'Firebase', category: 'Database' },
  { name: 'Supabase', category: 'Database' },
  { name: 'Prisma', category: 'Database' },
  { name: 'Docker', category: 'DevOps & Cloud' },
  { name: 'Kubernetes', category: 'DevOps & Cloud' },
  { name: 'AWS', category: 'DevOps & Cloud' },
  { name: 'Google Cloud', category: 'DevOps & Cloud' },
  { name: 'Azure', category: 'DevOps & Cloud' },
  { name: 'CI/CD', category: 'DevOps & Cloud' },
  { name: 'Linux', category: 'DevOps & Cloud' },
  { name: 'Figma', category: 'Design' },
  { name: 'Adobe XD', category: 'Design' },
  { name: 'Photoshop', category: 'Design' },
  { name: 'Illustrator', category: 'Design' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Motion Design', category: 'Design' },
  { name: 'Machine Learning', category: 'Data Science' },
  { name: 'Data Analysis', category: 'Data Science' },
  { name: 'TensorFlow', category: 'Data Science' },
  { name: 'PyTorch', category: 'Data Science' },
  { name: 'Pandas', category: 'Data Science' },
  { name: 'SQL', category: 'Data Science' },
  { name: 'WordPress', category: 'Other' },
  { name: 'Shopify', category: 'Other' },
  { name: 'SEO', category: 'Other' },
  { name: 'Content Writing', category: 'Other' },
  { name: 'Video Editing', category: 'Other' },
  { name: '3D Modeling', category: 'Other' },
  { name: 'REST API Design', category: 'Other' },
];

export default Skill;
