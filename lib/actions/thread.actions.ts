"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db/db";
import { connect } from "http2";

interface Params {
  text: string;
  author: string;
  communityId?: string | null;
  path: string;
}

export async function createThread({
  text,
  author,
  communityId,
  path,
}: Params) {
  console.log(text, author);
  try {
    const createThread = await db.thread.create({
      data: {
        text,
        author,
        communityId,
      },
    });

    await db.user.update({
      where: {
        id: author,
      },
      data: {
        threads: {
          connect: { id: createThread.id },
        },
      },
    });

    revalidatePath(path);
  } catch (error: any) {
    console.log(error);
    throw new Error(`Error creating thread: ${error.message}`);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  const skipAmount = (pageNumber - 1) * pageSize;

  const postsQuery = db.thread.findMany({
    where: {
      OR: [{ parentId: null }, { parentId: undefined }],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      // Include author
      user: true,
      // Include children threads with their authors
      children: {
        include: {
          user: true,
        },
      },
    },
    skip: skipAmount,
  });

  const totalPostsCount = await db.thread.count({
    where: {
      OR: [{ parentId: null }, { parentId: undefined }],
    },
  });

  const posts = await postsQuery;

  const isNext = totalPostsCount > skipAmount + posts.length;

  return {posts, isNext}
}

export async function fetchThreadById(threadId: string) {
 

  try {
    const thread = await db.thread.findUnique({
      where: { id: threadId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        community: {
          select: {
            id: true,
            // name: true,
            // image: true,
          },
        },
        children: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                // parentId: true,
                image: true,
              },
            },
            children: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    // parentId: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    console.log(thread);
    
    return thread;
    
  } catch (err) {
    console.error("Error while fetching thread:", err);
    throw new Error("Unable to fetch thread");
  }
}
