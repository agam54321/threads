// @ts-nocheck
import { fetchUserPosts } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import ThreadCard from "../cards/ThreadCard";
import { fetchCommunityPosts } from "@/lib/actions/community.actions";

interface Props{
    currentUserId: string;
    accountId: string | undefined;
    accountType: string;
}


const ThreadsTab = async ({currentUserId, accountId, accountType}: Props) => {
  console.log("==========================================");
  console.log(currentUserId, accountId, accountType);

    if(!accountId) return;

    let result : any;

    if(accountType === 'Community'){
      result = await fetchCommunityPosts(accountId);
    }
    else {
      result = await fetchUserPosts(accountId)
    }
    
    if(!result) redirect('/')

  return (
    <section className="mt-9 flex flex-col gap-10">
        {result.threads.map((thread: any)=>(
              <ThreadCard
            key={thread.id}
            id={thread.id}
            currentUserId={currentUserId}
            parentId={thread.parentId}
            content={thread.text}
            user={accountType === "User"
              ? { name: result.name, image: result.image, id: result.id } :
              { name: thread.user.name, image: thread.user.image, id: thread.user.id }}
            community={thread.community}
            createdAt={thread.createdAt}
            comments={thread.children} isComment={false}          />
        ))}
    </section>
  )
}

export default ThreadsTab;
