/**
 * CollisionGroups indicate like members that do not collide with each other. Use [[CollisionGroupManager]] to create [[CollisionGroup]]s
 *
 * For example:
 *
 * Players have collision group "player"
 *
 * ![Player Collision Group](/assets/images/docs/CollisionGroupsPlayer.png)
 *
 * Enemies have collision group "enemy"
 *
 * ![Enemy Collision Group](/assets/images/docs/CollisionGroupsEnemy.png)
 *
 * Blocks have collision group "ground"
 *
 * ![Ground collision group](/assets/images/docs/CollisionGroupsGround.png)
 *
 * Players don't collide with each other, but enemies and blocks. Likewise, enemies don't collide with each other but collide
 * with players and blocks.
 *
 * This is done with bitmasking, see the following pseudo-code
 *
 * PlayerGroup = `0b001`
 * PlayerGroupMask = `0b110`
 *
 * EnemyGroup = `0b010`
 * EnemyGroupMask = `0b101`
 *
 * BlockGroup = `0b100`
 * BlockGroupMask = `0b011`
 *
 * Should Players collide? No because the bitwise mask evaluates to 0
 * `(player1.group & player2.mask) === 0`
 * `(0b001 & 0b110) === 0`
 *
 * Should Players and Enemies collide? Yes because the bitwise mask is non-zero
 * `(player1.group & enemy1.mask) === 1`
 * `(0b001 & 0b101) === 1`
 *
 * Should Players and Blocks collide? Yes because the bitwise mask is non-zero
 * `(player1.group & blocks1.mask) === 1`
 * `(0b001 & 0b011) === 1`
 */
export declare class CollisionGroup {
    /**
     * The `All` [[CollisionGroup]] is a special group that collides with all other groups including itself,
     * it is the default collision group on colliders.
     */
    static All: CollisionGroup;
    private _name;
    private _category;
    private _mask;
    /**
     * STOP!!** It is preferred that [[CollisionGroupManager.create]] is used to create collision groups
     *  unless you know how to construct the proper bitmasks. See https://github.com/excaliburjs/Excalibur/issues/1091 for more info.
     * @param name Name of the collision group
     * @param category 32 bit category for the group, should be a unique power of 2. For example `0b001` or `0b010`
     * @param mask 32 bit mask of category, or `~category` generally. For a category of `0b001`, the mask would be `0b110`
     */
    constructor(name: string, category: number, mask: number);
    /**
     * Get the name of the collision group
     */
    get name(): string;
    /**
     * Get the category of the collision group, a 32 bit number which should be a unique power of 2
     */
    get category(): number;
    /**
     * Get the mask for this collision group
     */
    get mask(): number;
    /**
     * Evaluates whether 2 collision groups can collide
     * @param other  CollisionGroup
     */
    canCollide(other: CollisionGroup): boolean;
    /**
     * Inverts the collision group. For example, if before the group specified "players",
     * inverting would specify all groups except players
     * @returns CollisionGroup
     */
    invert(): CollisionGroup;
    /**
     * Combine collision groups with each other. The new group includes all of the previous groups.
     *
     * @param collisionGroups
     */
    static combine(collisionGroups: CollisionGroup[]): CollisionGroup;
    /**
     * Creates a collision group that collides with the listed groups
     * @param collisionGroups
     */
    static collidesWith(collisionGroups: CollisionGroup[]): CollisionGroup;
}
