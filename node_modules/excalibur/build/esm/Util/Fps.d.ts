export interface FpsSamplerOptions {
    /**
     * Specify the sampling period in milliseconds (default 100)
     */
    samplePeriod?: number;
    /**
     * Specify the initial FPS
     */
    initialFps: number;
    /**
     * Specify the function used to return the current time (in milliseconds)
     */
    nowFn: () => number;
}
export declare class FpsSampler {
    private _fps;
    private _samplePeriod;
    private _currentFrameTime;
    private _frames;
    private _previousSampleTime;
    private _beginFrameTime;
    private _nowFn;
    constructor(options: FpsSamplerOptions);
    /**
     * Start of code block to sample FPS for
     */
    start(): void;
    /**
     * End of code block to sample FPS for
     */
    end(): void;
    /**
     * Return the currently sampled fps over the last sample period, by default every 100ms
     */
    get fps(): number;
    /**
     * Return the instantaneous fps, this can be less useful because it will fluctuate given the current frames time
     */
    get instant(): number;
}
