import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiServer } from "@/lib/api";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { AppEditor } from "@/components/editor";
import { SetProjectId } from "@/components/projectid";

async function getProject(displayname: string, projectId: string) {
  // TODO replace with a server action
  try {
    // Use absolute URL for apiServer.get
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window === 'undefined'
        ? `http://localhost:${process.env.PORT || 3000}`
        : '');
    const url = `${baseUrl}/api/local-projects/${projectId}`;
    const { data } = await apiServer.get(url);
    return data?.project || {};
  } catch (err) {
    console.error("Error fetching project:", err);
    return {};
  }
}

export default async function ProjectNamespacePage({
  params,
}: {
  params: Promise<{ namespace: string; repoId: string }>;
}) {
  const { namespace, repoId } = await params;
  const data = await getProject(namespace, repoId);

  if (!data?.pages) {
    redirect("/projects");
  }
  return (
    <>
      <SetProjectId repoId={repoId} />
      <AppEditor project={data} pages={data.pages} images={data.images ?? []} />
    </>
  );
}