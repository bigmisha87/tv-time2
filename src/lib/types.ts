export interface SeedShow {
  tvdbId: number;
  name: string;
  followed: boolean;
  favorited: boolean;
  episodesSeen: number;
  latestEpisodeId: number | null;
  latestSeenDate: string | null;
}
