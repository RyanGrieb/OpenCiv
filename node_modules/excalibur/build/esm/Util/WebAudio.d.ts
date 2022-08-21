export interface LegacyWebAudioSource {
    playbackState: string;
    PLAYING_STATE: 'playing';
    FINISHED_STATE: 'finished';
}
export declare class WebAudio {
    private static _UNLOCKED;
    /**
     * Play an empty sound to unlock Safari WebAudio context. Call this function
     * right after a user interaction event.
     * @source https://paulbakaus.com/tutorials/html5/web-audio-on-ios/
     */
    static unlock(): Promise<boolean>;
    static isUnlocked(): boolean;
}
