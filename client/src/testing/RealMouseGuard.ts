/**
 * Keeps the real mouse from undoing what a scenario sets up. Scenarios hover things with made-up mouse
 * events (to open a tooltip, say), and the real cursor moving anywhere over the game would end that
 * hover and fail the step. While held, mouse movement from the real mouse never reaches the game;
 * clicks and keys still do. Made-up events have isTrusted false, so they get through.
 */
export class RealMouseGuard {
    private static readonly BLOCKED_EVENTS = ["mousemove", "mouseleave"];
    private static held = false;

    public static hold() {
        if (RealMouseGuard.held) return;

        RealMouseGuard.held = true;
        RealMouseGuard.BLOCKED_EVENTS.forEach((type) => window.addEventListener(type, RealMouseGuard.block, true));
    }

    /**
     * Lets the real mouse back in at its next click, so whatever the scenario left showing (a tooltip
     * to look at) stays put until then.
     */
    public static releaseOnNextClick() {
        if (!RealMouseGuard.held) return;

        window.addEventListener("mousedown", RealMouseGuard.release, { capture: true, once: true });
    }

    private static release() {
        RealMouseGuard.held = false;
        RealMouseGuard.BLOCKED_EVENTS.forEach((type) => window.removeEventListener(type, RealMouseGuard.block, true));
    }

    private static block(event: Event) {
        if (event.isTrusted) event.stopImmediatePropagation();
    }
}
