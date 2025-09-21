import { redirect } from "next/navigation";

import { MyProjects } from "@/components/my-projects";
import { getProjects } from "@/app/actions/projects";
import { ClearProjectId } from "@/components/projectid";

export default async function ProjectsPage() {
  const { ok, projects } = await getProjects();
  if (!ok) {
    redirect("/");
  }
  return (
    <>
      <ClearProjectId />
      <MyProjects projects={projects} />
    </>
  );
}
