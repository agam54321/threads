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



export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  try {
    // Find the original thread by its ID
    const originalThread = await db.thread.findUnique({
      where: { id: threadId },
    });

    if (!originalThread) {
      throw new Error(`Thread with ID ${threadId} not found`);
    }

    // Create the new comment thread
    const savedCommentThread = await db.thread.create({
      data: {
        text: commentText,
        user: { connect: { id: userId } },
        parent: { connect: { id: threadId } }, // Change from parentId to parent
      },
    });

    // Add the comment thread's ID to the original thread's children array
    await db.thread.update({
      where: { id: threadId },
      data: {
        children: {
          connect: { id: savedCommentThread.id },
        },
      },
    });

    // Revalidate the path (e.g., invalidate cache or update the view)
    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    // Add more context to the error
    throw new Error(`Unable to add comment: ${err.message}`);
  }
}