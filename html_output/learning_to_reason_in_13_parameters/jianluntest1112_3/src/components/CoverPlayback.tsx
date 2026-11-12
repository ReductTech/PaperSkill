import { createContext, useContext } from 'react';

export const CoverPlaybackContext = createContext({ progress: 0, playing: false });
/** Cover animations must share this clock for a fair, synchronized comparison. */
export const useCoverPlayback = () => useContext(CoverPlaybackContext);
