import * as z from 'zod';

export const ThreadValidation = z.object({
    thread: z.string().min(1, "Thread content is required"),
    // author: z.string(),
});

export const CommentValidation = z.object({
    thread: z.string(),
});