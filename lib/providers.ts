export const PROVIDERS = {
  lmstudio: {
    name: "LM Studio",
    max_tokens: parseInt(process.env.tokenlimit) || 4096,
    id: "lmstudio",
  }
};

function get_lmstudio() {
  const host = process.env.LMHOST || "127.0.0.1";
  const port = process.env.LMPORT || "1234";
  const con = `${(host).trim()}:${(port).trim()}`;
  return con;
}

export const LMSTUDIO_URL = `http://${get_lmstudio()}`;

export async function getLmStudioModels() {
  try {
    const res = await fetch(`${LMSTUDIO_URL}/v1/models`);
    const data = await res.json();
    const flag_model_list = ['embedding'];
    const response = (data.data || []).map((m: any) => {
      if ( m.id && !flag_model_list.some(flag => m.id.includes(flag)) ) {
        return {
          value: m.id,
          label: m.id,
          providers: ["lmstudio"],
          isNew: true,
          autoProvider: "lmstudio"
        };
      }
      return null;
    }).filter(Boolean);
    // Adapt this mapping to your model object structure
    return response;
  } catch (e) {
    // fallback or error handling
    return [];
  }
}
