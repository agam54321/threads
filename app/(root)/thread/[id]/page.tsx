// @ts-nocheck
import ThreadCard from "@/components/cards/ThreadCard";
import { currentUser } from "@clerk/nextjs/server";
import { fetchUser } from "@/lib/actions/user.actions";
import { redirect } from "next/dist/server/api-utils";
import { fetchThreadById } from "@/lib/actions/thread.actions";
import Comment from "@/components/forms/Comment";

const Page = async ({params}: {params:{id: string}})=>{

    if(!params.id) return null;

    const user = await currentUser();

    if(!user) return null;

    const userInfo = await fetchUser(user.id);
    if(!userInfo?.onboarded) redirect('onboarding')

        const thread = await fetchThreadById(params.id)

        return(

    <section className="relative">

        <div>
    
        <ThreadCard
            key={thread.id}
            id={thread.id}
            currentUserId={user?.id || ""}
            parentId={thread.parentId}
            content={thread.text}
            user={thread.user}
            community={thread.community}
            createdAt={thread.createdAt}
            comments={thread.children}
   />
    
        </div>

        <div className="mt-7">
            <Comment
            threadId = {thread.id}
            currentUserImg = {user.imageUrl}
            currentUserId = {JSON.stringify(userInfo.id)}
            />
            
        </div>

        <div className="mt-10">
            {thread.children.map((childItem: any) =>(
                  <ThreadCard
                  key={childItem.id}
                  id={childItem.id}
                  currentUserId={childItem?.id || ""}
                  parentId={childItem.parentId}
                  content={childItem.text}
                  user={childItem.user}
                  community={childItem.community}
                  createdAt={childItem.createdAt}
                  comments={childItem.children}
                  isComment
         />
            ))}
        </div>
    </section>



)
}

export default Page;