import { AppEditor } from "@/components/editor";
import { ClearProjectId } from "@/components/projectid";

export default function ProjectsNewPage() {
  return (
    <>
      <ClearProjectId />
      <AppEditor isNew />
    </>
  );
}
