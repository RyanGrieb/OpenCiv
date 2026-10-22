import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { ResearchTreeWindow } from "../../ui/windows/ResearchTreeWindow";
import { TestUtils } from "../TestUtils";

// Opens the research tree and picks techs the way a click on their buttons does: an available tech is
// researched straight away, one deeper in the tree queues every tech on the way to it, as in Civ 5. Ends
// with the tree left open so the button colors and queue badges can be looked over by eye.
export function setupResearchTreeTest(game: Game) {
    const runner = new TestRunner("ResearchTree");
    const utils = new TestUtils(game);
    let tree: ResearchTreeWindow | undefined;

    const research = () => {
        const player = utils.getClientPlayer();
        return [player.getCurrentResearch()?.techName, ...player.getResearchQueue()].join(", ");
    };

    const expectResearch = async (expected: string) => {
        await utils.waitUntil(() => research() === expected, 5000, `research to be ${expected}`);
        utils.log(`Research: ${research()}`, "yellow");
        return research() === expected;
    };

    runner.addStep({
        name: "Login and Join Game",
        action: async () => {
            await utils.ensureInGame();
        },
        verification: async () => game.getCurrentScene().getName() === "in_game"
    });

    runner.addStep({
        name: "Open the research tree",
        action: async () => {
            utils.getInGameScene().toggleResearchUI();
            tree = utils.getInGameScene().getResearchTreeWindow();
            await utils.waitUntil(() => tree.hasTech("Writing"), 5000, "Techs to arrive from the server");
        },
        verification: () => tree !== undefined && tree.hasTech("Writing")
    });

    runner.addStep({
        name: "Clicking Writing researches Pottery first and queues Writing",
        action: async () => {
            tree.chooseTech("Writing");
        },
        verification: () => expectResearch("Pottery, Writing")
    });

    runner.addStep({
        name: "Clicking an available tech researches it and clears the queue",
        action: async () => {
            tree.chooseTech("Mining");
        },
        verification: () => expectResearch("Mining")
    });

    runner.addStep({
        name: "Clicking Construction queues its prerequisites first",
        action: async () => {
            tree.chooseTech("Construction");
        },
        verification: async () => {
            await utils.waitUntil(() => research().endsWith("Construction"), 5000, "Construction to be queued");
            const order = research().split(", ");
            utils.log(`Research: ${order.join(", ")}`, "yellow");
            return ["Masonry", "The Wheel", "Animal Husbandry"].every(
                (prereq) => order.indexOf(prereq) >= 0 && order.indexOf(prereq) < order.indexOf("Construction")
            );
        }
    });

    return runner;
}
