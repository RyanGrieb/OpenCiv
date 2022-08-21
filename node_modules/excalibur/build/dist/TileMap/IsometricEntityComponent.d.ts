import { Component } from '../EntityComponentSystem/Component';
import { IsometricMap } from './IsometricMap';
export declare class IsometricEntityComponent extends Component<'ex.isometricentity'> {
    readonly type = "ex.isometricentity";
    /**
     * Vertical "height" in the isometric world
     */
    elevation: number;
    map: IsometricMap;
    /**
     * Specify the isometric map to use to position this entity's z-index
     * @param map
     */
    constructor(map: IsometricMap);
}
