import { z } from 'zod';

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const SessionDTOSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.number().optional(),
  user: AuthUserSchema,
});
export type SessionDTO = z.infer<typeof SessionDTOSchema>;
