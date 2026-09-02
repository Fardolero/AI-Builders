const firstNonEmpty = (...values: Array<string | undefined>) => {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
};

export function getGitHubOAuthCredentials() {
  const clientId = firstNonEmpty(
    process.env.AUTH_GITHUB_ID,
    process.env.GITHUB_CLIENT_ID,
    process.env.GITHUB_ID,
  );
  const clientSecret = firstNonEmpty(
    process.env.AUTH_GITHUB_SECRET,
    process.env.GITHUB_CLIENT_SECRET,
    process.env.GITHUB_SECRET,
  );

  return { clientId, clientSecret };
}

export function isGitHubOAuthConfigured() {
  const { clientId, clientSecret } = getGitHubOAuthCredentials();
  return Boolean(clientId && clientSecret);
}
