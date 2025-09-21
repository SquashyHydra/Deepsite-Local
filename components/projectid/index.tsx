"use client";
import { useEffect } from "react";

export function SetProjectId({ repoId }: { repoId: string }) {
  useEffect(() => {
    localStorage.setItem("ProjectID", repoId);
  }, [repoId]);
  return null;
}

export function ClearProjectId() {
  useEffect(() => {
    localStorage.removeItem("ProjectID");
  }, []);
    return null;
}

export function GetProjectId(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("ProjectID") : null;
}