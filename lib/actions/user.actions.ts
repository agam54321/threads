
"use server"

import { db } from "../db/db"
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
}: Params){
    try {
        await db.user.upsert({
            where: {
                id: userId
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
                onboarded: true
            }
        })
        if(path === '/profile/edit'){
            revalidatePath(path);
        }
    } catch(error: any) {
        throw new Error(`Failed to create/update user: ${error.message}`)
    }
}

export async function fetchUser(userId: string) {
    try {
        return await db.user.findUnique({
            where: {
                id: userId
            }
        })
    }catch(error: any) {
        throw new Error(`Failed to fetch user: ${error.message}`);
    }
}