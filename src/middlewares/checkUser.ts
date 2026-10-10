import { Middleware } from '@/types/Middleware';
import { userService } from '@/services/userService';
import { syncUserProfile } from '@/services/profileSyncService';

export const checkUser: Middleware = async (message, client, args, next) => {
  const user = {
    discordId: message.author.id,
    username: message.author.username,
  };

  try {
    await userService.createUser(user);
    // Fire-and-forget: keep backend username/avatar in sync without delaying the command.
    void syncUserProfile(message.author);
    await next();
  } catch (error: any) {
    console.error('[Middleware] checkUser error:', error?.response?.data?.error || error?.message);
    message.reply('An error occurred while verifying your user. Please try again later.');
  }
};
