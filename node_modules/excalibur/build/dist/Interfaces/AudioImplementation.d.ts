import { Audio } from './Audio';
export declare type ExResponseType = '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
export interface ExResponseTypesLookup {
    [name: string]: ExResponseType;
}
export declare class ExResponse {
    static type: ExResponseTypesLookup;
}
/**
 * Represents an audio implementation like [[WebAudioInstance]]
 */
export interface AudioImplementation {
    /**
     * XHR response type
     */
    responseType: ExResponseType;
    /**
     * Processes raw data and transforms into sound data
     */
    processData(data: Blob | ArrayBuffer): Promise<string | AudioBuffer>;
    /**
     * Factory method that returns an instance of a played audio track
     */
    createInstance(data: string | AudioBuffer): Audio;
}
