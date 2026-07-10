const providers = {
  anthropic: require("./aiProviders/anthropicProvider"),
  openai: require("./aiProviders/openaiProvider"),
  mock: require("./aiProviders/mockProvider"),
};

function getAiProvider() {
  const providerName = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(
      `Unknown AI_PROVIDER "${providerName}". Valid options: ${Object.keys(providers).join(", ")}`
    );
  }
  return provider;
}

module.exports = { getAiProvider };
