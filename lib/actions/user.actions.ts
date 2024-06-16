"use server";

import { db } from "../db/db";
import { revalidatePath } from "next/cache";

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params) {
  try {
    await db.user.upsert({
      where: {
        id: userId,
      },
      update: {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      create: {
        id: userId,
        username: username.toLocaleLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
    });
    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUser(userId: string) {
  try {
    return await db.user.findUnique({
      where: {
        id: userId,
      },
      include:{
        threads: true
      }
    });
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    // Find all threads authored by the user with the given userId
    const userThreads = await db.user.findUnique({
      where: { id: userId },
      include: {
        threads: {
          include: {
            community: {
              select: {
                name: true,
                id: true,
                image: true,
              },
            },
            children: {
              include: {
                user: {
                  select: {
                    name: true,
                    image: true,
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return userThreads;
  } catch (error) {
    console.error("Error fetching user threads:", error);
    throw error;
  }
}


export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: "asc" | "desc";
}) {
  try {
    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a filter object to exclude the current user and optionally filter by search string.
    const where = {
      id: { not: userId }, // Exclude the current user
      OR: searchString
        ? [
            { username: { contains: searchString, mode: 'insensitive' } },
            { name: { contains: searchString, mode: 'insensitive' } },
          ]
        : undefined,
    };

    // Fetch the users with pagination and sorting.
    const users = await db.user.findMany({
      where : {
        id: { not: userId }, // Exclude the current user
        OR: searchString
          ? [
              { username: { contains: searchString, mode: 'insensitive' } },
              { name: { contains: searchString, mode: 'insensitive' } },
            ]
          : undefined,
      },
      skip: skipAmount,
      take: pageSize,
      orderBy: {
        // createdAt: sortBy,
      },
    });

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await db.user.count({ where : {
      id: { not: userId }, // Exclude the current user
      OR: searchString
        ? [
            { username: { contains: searchString, mode: 'insensitive' } },
            { name: { contains: searchString, mode: 'insensitive' } },
          ]
        : undefined,
    }});

    // Check if there are more users beyond the current page.
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  } 
}


export async function getActivity(userId: string) {
  try {
    // Find all threads created by the user
    const userThreads = await db.thread.findMany({
      where: {
        user: {
          id: userId
        }
      },
      select: {
        id: true,
        children: {
          select: {
            id: true
          }
        }
      }
    });

    // Collect all the child thread ids (replies) from the 'children' field of each user thread
    const childThreadIds = userThreads.flatMap(userThread => 
      userThread.children.map(child => child.id)
    );

    // Find and return the child threads (replies) excluding the ones created by the same user
    const replies = await db.thread.findMany({
      where: {
        id: {
          in: childThreadIds
        },
        user: {
          id: {
            not: userId
          }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            id: true
          }
        }
      }
    });

    return replies;
  } catch (error) {
    console.error("Error fetching replies: ", error);
    throw error;
  } 
}
