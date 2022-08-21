import { Audio } from '../../Interfaces/Audio';
/**
 * Internal class representing a Web Audio AudioBufferSourceNode instance
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
 */
export declare class WebAudioInstance implements Audio {
    private _src;
    private _instance;
    private _audioContext;
    private _volumeNode;
    private _playingResolve;
    private _playingPromise;
    private _stateMachine;
    private _createNewBufferSource;
    private _handleEnd;
    private _volume;
    private _loop;
    private _playStarted;
    set loop(value: boolean);
    get loop(): boolean;
    set volume(value: number);
    get volume(): number;
    private _duration;
    /**
     * Returns the set duration to play, otherwise returns the total duration if unset
     */
    get duration(): number;
    /**
     * Set the duration that this audio should play.
     *
     * Note: if you seek to a specific point the duration will start from that point, for example
     *
     * If you have a 10 second clip, seek to 5 seconds, then set the duration to 2, it will play the clip from 5-7 seconds.
     */
    set duration(duration: number);
    constructor(_src: AudioBuffer);
    isPlaying(): boolean;
    isPaused(): boolean;
    play(playStarted?: () => any): Promise<boolean>;
    pause(): void;
    stop(): void;
    seek(position: number): void;
    getTotalPlaybackDuration(): number;
    getPlaybackPosition(): number;
    private _playbackRate;
    set playbackRate(playbackRate: number);
    get playbackRate(): number;
}
