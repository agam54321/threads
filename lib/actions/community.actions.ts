// @ts-nocheck

"use server";

import { db } from "../db/db";


export async function createCommunity(
  id: string,
  name: string,
  username: string,
  image: string,
  bio: string,
  createdById: string
) {
  try {
    const user = await db.user.findUnique({ where: { id: createdById } });

    if (!user) {
      throw new Error("User not found");
    }

    const createdCommunity = await db.community.create({
      data: {
        id,
        name,
        username,
        image,
        bio,
        createdById: user.id,
        members: {
          connect: { id: user.id }
        }
      }
    });

    return createdCommunity;
  } catch (error) {
    console.error("Error creating community:", error);
    throw error;
  }
}

export async function fetchCommunityDetails(id: string) {
  try {
    const communityDetails = await db.community.findUnique({
      where: { id },
      include: {
        createdBy: true,
        members: {
          select: { name: true, username: true, image: true, id: true }
        }
      }
    });

    return communityDetails;
  } catch (error) {
    console.error("Error fetching community details:", error);
    throw error;
  }
}


export async function fetchCommunityPosts(id: string) {
  try {
    const communityPosts = await db.community.findUnique({
      where: { id },
      include: {
        threads: {
          include: {
            user: {
              select: { name: true, image: true, id: true }
            },
            children: {
              include: {
                user: {
                  select: { image: true, id: true }
                }
              }
            }
          }
        }
      }
    });

    return communityPosts;
  } catch (error) {
    console.error("Error fetching community posts:", error);
    throw error;
  }
}


export async function fetchCommunities({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: "asc" | "desc";
}) {
  try {
    const skipAmount = (pageNumber - 1) * pageSize;
    const orderBy = sortBy === "asc" ? "asc" : "desc";

    const communities = await db.community.findMany({
      where: {
        OR: [
          { username: { contains: searchString, mode: "insensitive" } },
          { name: { contains: searchString, mode: "insensitive" } }
        ]
      },
      orderBy: {
        createdAt: orderBy
      },
      skip: skipAmount,
      take: pageSize,
      include: {
        members: true
      }
    });

    const totalCommunitiesCount = await db.community.count({
      where: {
        OR: [
          { username: { contains: searchString, mode: "insensitive" } },
          { name: { contains: searchString, mode: "insensitive" } }
        ]
      }
    });

    const isNext = totalCommunitiesCount > skipAmount + communities.length;

    return { communities, isNext };
  } catch (error) {
    console.error("Error fetching communities:", error);
    throw error;
  }
}


export async function addMemberToCommunity(
  communityId: string,
  memberId: string
) {
  try {
    const community = await db.community.findUnique({ where: { id: communityId } });

    if (!community) {
      throw new Error("Community not found");
    }

    const user = await db.user.findUnique({ where: { id: memberId } });

    if (!user) {
      throw new Error("User not found");
    }

    if (community.members.some(member => member.id === user.id)) {
      throw new Error("User is already a member of the community");
    }

    const updatedCommunity = await db.community.update({
      where: { id: communityId },
      data: {
        members: {
          connect: { id: user.id }
        }
      }
    });

    return updatedCommunity;
  } catch (error) {
    console.error("Error adding member to community:", error);
    throw error;
  }
}

export async function removeUserFromCommunity(
  userId: string,
  communityId: string
) {
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    const community = await db.community.findUnique({ where: { id: communityId } });

    if (!user) {
      throw new Error("User not found");
    }

    if (!community) {
      throw new Error("Community not found");
    }

    const updatedCommunity = await db.community.update({
      where: { id: communityId },
      data: {
        members: {
          disconnect: { id: user.id }
        }
      }
    });

    await db.user.update({
      where: { id: userId },
      data: {
        communities: {
          disconnect: { id: communityId }
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing user from community:", error);
    throw error;
  }
}


export async function updateCommunityInfo(
  communityId: string,
  name: string,
  username: string,
  image: string
) {
  try {
    const updatedCommunity = await db.community.update({
      where: { id: communityId },
      data: { name, username, image }
    });

    return updatedCommunity;
  } catch (error) {
    console.error("Error updating community information:", error);
    throw error;
  }
}


export async function deleteCommunity(communityId: string) {
  try {
    const deletedCommunity = await db.community.delete({
      where: { id: communityId },
      include: {
        members: true,
        threads: true
      }
    });

    await db.thread.deleteMany({
      where: { communityId }
    });

    const communityUsers = deletedCommunity.members;

    const updateUserPromises = communityUsers.map((user) =>
      db.user.update({
        where: { id: user.id },
        data: {
          communities: {
            disconnect: { id: communityId }
          }
        }
      })
    );

    await Promise.all(updateUserPromises);

    return deletedCommunity;
  } catch (error) {
    console.error("Error deleting community:", error);
    throw error;
  }
}
