import { Component } from '../EntityComponentSystem/Component';
import { Vector } from '../Math/vector';
export declare class ParallaxComponent extends Component<'ex.parallax'> {
    readonly type = "ex.parallax";
    parallaxFactor: Vector;
    constructor(parallaxFactor?: Vector);
}
