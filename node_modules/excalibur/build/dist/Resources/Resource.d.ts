import { Loadable } from '../Interfaces/Loadable';
import { Logger } from '../Util/Log';
import { EventDispatcher } from '../EventDispatcher';
/**
 * The [[Resource]] type allows games built in Excalibur to load generic resources.
 * For any type of remote resource it is recommended to use [[Resource]] for preloading.
 */
export declare class Resource<T> implements Loadable<T> {
    path: string;
    responseType: '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
    bustCache: boolean;
    data: T;
    logger: Logger;
    events: EventDispatcher;
    /**
     * @param path          Path to the remote resource
     * @param responseType  The type to expect as a response: "" | "arraybuffer" | "blob" | "document" | "json" | "text";
     * @param bustCache     Whether or not to cache-bust requests
     */
    constructor(path: string, responseType: '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text', bustCache?: boolean);
    /**
     * Returns true if the Resource is completely loaded and is ready
     * to be drawn.
     */
    isLoaded(): boolean;
    private _cacheBust;
    /**
     * Begin loading the resource and returns a promise to be resolved on completion
     */
    load(): Promise<T>;
}
