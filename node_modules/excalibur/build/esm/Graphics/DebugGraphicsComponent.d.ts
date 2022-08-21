import { ExcaliburGraphicsContext } from '.';
import { Component } from '../EntityComponentSystem/Component';
/**
 * Provide arbitrary drawing for the purposes of debugging your game
 *
 * Will only show when the Engine is set to debug mode [[Engine.showDebug]] or [[Engine.toggleDebug]]
 *
 */
export declare class DebugGraphicsComponent extends Component<'ex.debuggraphics'> {
    draw: (ctx: ExcaliburGraphicsContext) => void;
    useTransform: boolean;
    readonly type = "ex.debuggraphics";
    constructor(draw: (ctx: ExcaliburGraphicsContext) => void, useTransform?: boolean);
}
