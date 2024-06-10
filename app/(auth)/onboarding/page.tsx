// @ts-nocheck

import AccountProfile from "@/components/forms/AccountProfile";
import { currentUser } from "@clerk/nextjs/server";

const mockUserInfo = {
  _id: "mockId",
  username: "mockUsername",
  name: "mockName",
  bio: "mockBio",
  image: "mockImage",
};

async function page() {

  const user = await currentUser();

  const userData = {
    id: user?.id ||'',
    objectId: mockUserInfo._id,
    username: mockUserInfo.username || user?.username,
    name: mockUserInfo.name || user?.firstName || "",
    bio: mockUserInfo.bio || "",
    image: mockUserInfo.image || user?.imageUrl, 
  };


  return (
    <main className="mx-auto flex max-w-3xl flex-col justify-start px-10 py-20">
      <h1 className="head-text">Onboarding</h1>
      <p className="mt-3 text-base-regular text-light-2">Complete your profile now to use Threads</p>

      <section className="mt-9 bg-dark-2 p-10">
        <AccountProfile user = {userData}
        btnTitle = "Continue"/>
      </section>
    </main>
  );
}

export default page;