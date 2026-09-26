import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { Label } from "../../ui/Label";
import { ResearchTreeWindow } from "../../ui/ResearchTreeWindow";
import { TechDetailWindow } from "../../ui/TechDetailWindow";
import { TestUtils } from "../TestUtils";

// Opens the research tree and checks the wiki-style tech window: cost, Requires, Leads to, Enables
// (read from the server's unit/building/improvement configs) and Notes. Ends with Animal Husbandry
// left open so it can be looked over by eye.
export function setupTechDetailWindowTest(game: Game) {
    const runner = new TestRunner("TechDetailWindow");
    const utils = new TestUtils(game);
    let tree: ResearchTreeWindow | undefined;

    const detail = (): TechDetailWindow | undefined => tree?.getDetailWindow();

    const openTech = async (techName: string) => {
        if (!tree.openTechDetailByName(techName)) throw new Error(`${techName} isn't in the research tree`);
        await utils.waitUntil(
            () => detail()?.getTech().name === techName && detail().isBuilt(),
            5000,
            `${techName} window to finish building`
        );
    };

    const expectTexts = (expected: string[]) => {
        const texts = detail().getTexts();
        const missing = expected.filter((text) => !texts.includes(text));
        utils.log(`Shown: ${texts.join(" | ")}`, "yellow");
        if (missing.length > 0) utils.log(`Missing: ${missing.join(", ")}`, "red");
        return missing.length === 0;
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
            await utils.waitUntil(() => tree.openTechDetailByName("Pottery"), 5000, "Techs to arrive from the server");
        },
        verification: () => tree !== undefined && detail() !== undefined
    });

    runner.addStep({
        name: "Construction lists units, buildings, wonders and improvements from the config",
        action: async () => {
            await openTech("Construction");
        },
        verification: () =>
            expectTexts([
                "Construction", "Cost 105", "Requires", "Masonry", "The Wheel", "Leads to", "Engineering",
                "Enables", "Units", "Composite Bowman", "Buildings", "Colosseum", "Wonders", "Terracotta Army",
                "Improvements", "Lumber Mill"
            ])
    });

    runner.addStep({
        name: "Clicking a Leads to tech opens that tech's window",
        action: async () => {
            const link = detail().getActors().find((actor) => actor instanceof Label && actor.getText() === "Engineering");
            link.call("clicked");
            await utils.waitUntil(() => detail()?.getTech().name === "Engineering", 5000, "Engineering window to open");
        },
        verification: () => detail().getTech().name === "Engineering"
    });

    runner.addStep({
        name: "Animal Husbandry matches the wiki: Caravan, Pasture and its Notes",
        action: async () => {
            await openTech("Animal Husbandry");
        },
        verification: () =>
            expectTexts([
                "Animal Husbandry", "Cost 35", "Requires", "None", "Leads to", "Trapping", "The Wheel",
                "Enables", "Units", "Caravan", "Improvements", "Pasture", "Notes", "Reveals Horses",
                "Allows an additional trade route"
            ])
    });

    return runner;
}
