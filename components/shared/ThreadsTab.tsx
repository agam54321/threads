// @ts-nocheck
import { fetchUserPosts } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import ThreadCard from "../cards/ThreadCard";

interface Props{
    currentUserId: string;
    accountId: string;
    accountType: string;
}


const ThreadsTab = async ({currentUserId, accountId, accountType}: Props) => {

    //TODO : fetch profie posts
    let result = await fetchUserPosts(accountId);

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
                user={accountType==="User"
                    ?{name : result.name, image: result.image, id: result.id}:
                    {name: thread.user.name, image: thread.user.image, id: thread.user.id}
                }
                community={thread.community}
                createdAt={thread.createdAt}
                comments={thread.children}
          />
        ))}
    </section>
  )
}

export default ThreadsTab;
