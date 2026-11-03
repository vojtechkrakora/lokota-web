import { z } from 'astro/zod';

const text = z.string().trim().min(1);
const count = z.number().int().nonnegative();
const figures = { full: count, spares: count, errors: count, total: count };
const player = z.object({ name: text, club: text, ...figures }).strict()
  .refine(p => p.full + p.spares === p.total, { message: 'Player full + spares must equal total', path: ['total'] });
const pair = z.object({
  position: z.number().int().positive(),
  players: z.tuple([player, player]),
  ...figures,
  category: z.object({ label: text, position: z.number().int().positive() }).strict().optional(),
  note: text.optional(),
}).strict().superRefine((p, ctx) => {
  for (const key of ['full', 'spares', 'errors', 'total'] as const) {
    if (p.players[0][key] + p.players[1][key] !== p[key]) {
      ctx.addIssue({ code: 'custom', message: `Pair ${key} must match its two players`, path: [key] });
    }
  }
});

// Positions and names are deliberately not unique: retain source ties, typos and repeat starts.
export const tournamentResults = z.array(z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  label: text,
  pairs: z.array(pair).min(1),
}).strict()).refine(groups => new Set(groups.map(g => g.id)).size === groups.length, 'Result group IDs must be unique');
export type TournamentResults = z.infer<typeof tournamentResults>;
