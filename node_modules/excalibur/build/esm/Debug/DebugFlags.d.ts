import { ColorBlindnessMode } from '../Graphics/PostProcessor/ColorBlindnessMode';
import { Engine } from '../Engine';
export interface DebugFlags {
    colorBlindMode: ColorBlindFlags;
}
export declare class ColorBlindFlags {
    private _engine;
    private _colorBlindPostProcessor;
    constructor(engine: Engine);
    /**
     * Correct colors for a specified color blindness
     * @param colorBlindness
     */
    correct(colorBlindness: ColorBlindnessMode): void;
    /**
     * Simulate colors for a specified color blindness
     * @param colorBlindness
     */
    simulate(colorBlindness: ColorBlindnessMode): void;
    /**
     * Remove color blindness post processor
     */
    clear(): void;
}
