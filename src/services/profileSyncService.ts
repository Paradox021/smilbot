import { AxiosError } from 'axios';
import { User as DiscordUser } from 'discord.js';
import { userService, UserProfileUpdate } from './userService';

interface SyncedProfile {
  username: string;
  avatar: string | null;
}

/**
 * Last profile values successfully synced to the backend, per Discord ID.
 * In-memory only: after a restart every user is synced once on their next command.
 */
const syncedProfiles = new Map<string, SyncedProfile>();

/** Users with a PATCH in flight, to avoid duplicate requests from rapid commands. */
const inFlight = new Set<string>();

/**
 * Pushes the author's current Discord username/avatar to the backend when they
 * differ from the last synced values. Only changed fields are sent.
 *
 * Never throws: errors are logged and swallowed so it can be fired without
 * awaiting from the command flow.
 *
 * `username` uses `user.username` (the unique handle), consistent with the
 * value sent on POST /user by the checkUser middleware.
 */
export async function syncUserProfile(user: DiscordUser): Promise<void> {
  const discordId = user.id;
  if (inFlight.has(discordId)) return;

  const current: SyncedProfile = { username: user.username, avatar: user.avatar ?? null };
  const cached = syncedProfiles.get(discordId);

  const changes: UserProfileUpdate = {};
  if (!cached || cached.username !== current.username) changes.username = current.username;
  if (!cached || cached.avatar !== current.avatar) changes.avatar = current.avatar;
  if (Object.keys(changes).length === 0) return;

  inFlight.add(discordId);
  try {
    await userService.updateProfile(discordId, changes);
    syncedProfiles.set(discordId, current);
  } catch (error) {
    // 404: user not yet in the backend; the creation flow handles it and we retry next time.
    if (error instanceof AxiosError && error.response?.status === 404) return;
    const detail =
      error instanceof AxiosError
        ? (error.response?.data as { error?: unknown } | undefined)?.error ?? error.message
        : (error as Error)?.message;
    console.error(`[ProfileSync] Failed to sync profile for ${discordId}:`, detail);
  } finally {
    inFlight.delete(discordId);
  }
}
