import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { Unit } from "../../Unit";
import { InGameScene } from "../../scene/type/InGameScene";
import { UnitDisplayInfo } from "../../ui/hud/UnitDisplayInfo";
import { TestUtils } from "../TestUtils";
import { NetworkEvents } from "../../network/Client";

// Promotions, then hands-on. Your Warrior and Archer start with 30 XP (two promotions' worth) next to a
// second player's units. The scenario opens your Warrior's Promote list and picks Shock I, then hands
// over: promote the rest yourself, hover the badges under the XP bar, and attack to earn more XP
// (5 for a melee attack, 4 for defending, 2 for a ranged attack). The second player never acts.
export function setupPromotionsTest(game: Game) {
    const runner = new TestRunner("Promotions");
    const utils = new TestUtils(game);
    const clientPlayer = () => utils.getClientPlayer();
    let warrior: Unit | undefined;

    const displayInfo = (): UnitDisplayInfo | undefined => warrior?.["unitDisplayInfo"];
    const promotionNames = () => warrior.getPromotionData().promotions.map((promotion) => promotion.name);
    const choiceNames = () => warrior.getPromotionData().promotionChoices.map((promotion) => promotion.name);

    runner.addStep({
        name: "Start next to a second player with 30 XP on your units",
        action: async () => {
            await utils.startGameWithSecondPlayer({
                autoEndTurns: true,
                gameOptions: { startWithArcher: true, startingExperience: 30 }
            });
            // The first turn starting unselects units, which would close the Promote list mid-scenario.
            let turnStarted = false;
            NetworkEvents.on({
                eventName: "newTurn",
                parentObject: runner,
                callback: () => {
                    turnStarted = true;
                }
            });
            try {
                await utils.waitUntil(() => turnStarted, 5000, "The first turn to start");
            } catch {
                // It may have started before this listened.
            }
            await utils.waitUntil(
                () => {
                    warrior = clientPlayer()?.getUnits().find((unit) => unit.getName() === "Warrior");
                    return !!warrior;
                },
                10000,
                "Your Warrior to appear"
            );
            game.getCurrentSceneAs<InGameScene>().focusOnTile(warrior.getTile(), 3);
        },
        verification: () => warrior.getPromotionData().experience === 30
    });

    runner.addStep({
        name: "Your Warrior's window shows XP 30/10 and a Promote button",
        action: async () => {
            clientPlayer().selectUnit(warrior);
            await utils.waitUntil(() => !!displayInfo(), 3000, "Unit info window to open");
        },
        verification: () =>
            warrior.getActions().some((action) => action.getName() === "promote" && action.requirementsMet(warrior))
    });

    runner.addStep({
        name: "Promote lists the Warrior's first promotions",
        action: async () => {
            displayInfo().togglePromotionWindow();
            await utils.waitUntil(() => !!displayInfo().getPromotionWindow(), 3000, "Promotion list to open");
            await utils.delay(1000);
        },
        verification: () =>
            ["Shock I", "Drill I", "Cover I"].every((name) => choiceNames().includes(name)) &&
            !choiceNames().includes("Shock II") &&
            !choiceNames().includes("Accuracy I")
    });

    runner.addStep({
        name: "Picking Shock I adds its badge, and offers Shock II next",
        action: async () => {
            const window = displayInfo().getPromotionWindow();
            const index = choiceNames().indexOf("Shock I");
            window["buttons"][index]["callbackFunction"]();
            await utils.waitUntil(() => promotionNames().includes("Shock I"), 3000, "Shock I to be granted");
        },
        verification: () =>
            !displayInfo().getPromotionWindow() &&
            warrior.getPromotionData().experienceNeeded === 30 &&
            choiceNames().includes("Shock II")
    });

    runner.addStep({
        name: "Your turn",
        action: async () => {
            utils.log("Your Warrior and Archer can each still take a promotion: press Promote (the gold", "yellow");
            utils.log("chevrons) and hover a promotion to see what it does. Hover the badges under the", "yellow");
            utils.log("XP bar too. Attack the enemy to earn more XP: 5 for a melee attack, 4 for defending,", "yellow");
            utils.log("2 for a ranged attack. Promotions also change the attack preview's odds.", "yellow");

            // Let clicks through to the map wherever this log sits.
            const results = document.getElementById("test-results");
            if (results) results.style.pointerEvents = "none";
        },
        verification: () => true
    });

    return runner;
}
