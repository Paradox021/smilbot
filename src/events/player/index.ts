// src/events/player/index.ts
import { playerStart } from './playerStart';
import { audioTrackAdd } from './audioTrackAdd';
import { emptyQueue } from './emptyQueue';
import { error } from './error';
import { playerError } from './playerError';
import { audioTracksAdd } from './audioTracksAdd';
import { queueDelete } from './queueDelete';
import { playerPause, playerResume } from './playerPauseResume';

/**
 * Array with all the Player events
 */
export const playerEvents = [
    playerStart,
    audioTrackAdd,
    emptyQueue,
    error,
    playerError,
    audioTracksAdd,
    queueDelete,
    playerPause,
    playerResume,
];
