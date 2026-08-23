import { supabase } from "../lib/supabase";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export async function savePcBuild({
  name,
  profileId,
  selectedProductIds,
  total,
  userId,
}) {
  return unwrap(
    await supabase
      .from("saved_pc_builds")
      .insert({
        user_id: userId,
        name: name.trim(),
        profile_id: profileId || null,
        selected_product_ids: selectedProductIds,
        total_snapshot: total,
      })
      .select()
      .single(),
  );
}

export async function removePcBuild(buildId) {
  return unwrap(
    await supabase.from("saved_pc_builds").delete().eq("id", buildId),
  );
}

export function createBuildUrl(selectedProductIds) {
  const url = new URL("/build-pc", window.location.origin);
  url.searchParams.set(
    "build",
    window.btoa(JSON.stringify(selectedProductIds)),
  );
  return `${url.pathname}${url.search}`;
}
