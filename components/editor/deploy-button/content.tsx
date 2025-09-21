import { Rocket } from "lucide-react";
import Image from "next/image";

import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SpaceIcon from "@/assets/space.svg";
import { api } from "@/lib/api";
import { Page } from "@/types";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { title } from "process";
import { create } from "domain";

function decodeUuidToTitle(uuid: string): string {
    // Remove hyphens
    const hex = uuid.replace(/-/g, '');
    // Convert hex to bytes
    const bytes = [];
    for (let i = 0; i < 32; i += 2) {
        bytes.push(parseInt(hex.slice(i, i+2), 16));
    }
    // Remove padding zeros at the end
    let len = bytes.length;
    while (len > 0 && bytes[len-1] === 0) len--;
    const trimmed = bytes.slice(0, len);
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(trimmed));
}

export const DeployButtonContent = ({
  pages,
  options,
  prompts,
}: {
  pages: Page[];
  options?: {
    title?: string;
    description?: string;
  };
  prompts: string[];
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState({
    title: "",
  });

  const createSpace = async () => {
    if (!config.title) {
      toast.error("Please enter a title for your space.");
      return;
    }
    setLoading(true);

    try {
      // Save project data locally (optional: implement your own local save logic here)
      // Then publish the space by copying to /public/projects/{projectId}
      // We'll use the title as the projectId (slugified)
      const res = await api.post("/publish-space", {
        title: config.title,
        pages,
        prompts,
      });
      if (res.data.ok) {
        router.push(`/projects/${res.data.project.project_id}?deploy=true`);
      } else {
        toast.error(res?.data?.error || "Failed to publish space");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const projectId = localStorage.getItem("ProjectID");
  if (projectId) {
    config.title = decodeUuidToTitle(projectId);
    createSpace
    return
  }

  return (
    <>
      <header className="bg-neutral-50 p-6 border-b border-neutral-200/60">
        <div className="flex items-center justify-center -space-x-4 mb-3">
          <div className="size-9 rounded-full bg-amber-200 shadow-2xs flex items-center justify-center text-xl opacity-50">
            🚀
          </div>
          <div className="size-11 rounded-full bg-red-200 shadow-2xl flex items-center justify-center z-2">
            <Image src={SpaceIcon} alt="Space Icon" className="size-7" />
          </div>
          <div className="size-9 rounded-full bg-sky-200 shadow-2xs flex items-center justify-center text-xl opacity-50">
            👻
          </div>
        </div>
        <p className="text-xl font-semibold text-neutral-950">
          Publish as Space!
        </p>
        <p className="text-sm text-neutral-500 mt-1.5">
          {options?.description ??
            "Save and Publish your project to a Space on the Hub. Spaces are a way to share your project with the world."}
        </p>
      </header>
      <main className="space-y-4 p-6">
        <div>
          <p className="text-sm text-neutral-700 mb-2">
            Choose a title for your space:
          </p>
          <Input
            type="text"
            placeholder="My Awesome Website"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            className="!bg-white !border-neutral-300 !text-neutral-800 !placeholder:text-neutral-400 selection:!bg-blue-100"
          />
        </div>
        <div>
          <p className="text-sm text-neutral-700 mb-2">
            Then, let&apos;s publish it!
          </p>
          <Button
            variant="black"
            onClick={createSpace}
            className="relative w-full"
            disabled={loading}
          >
            Publish Space <Rocket className="size-4" />
            {loading && <Loading className="ml-2 size-4 animate-spin" />}
          </Button>
        </div>
      </main>
    </>
  );
};
