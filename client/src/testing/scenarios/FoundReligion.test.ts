import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { TestUtils } from "../TestUtils";

const PANTHEON_COST = 10;
const RELIGION_COST = 200;
const RELIGION = "Islam";
const FOUNDER_BELIEF = "Initiation Rites";
const FOLLOWER_BELIEF = "Feed the World";
const INITIATION_RITES_GOLD = 100;

// Founds a religion against a live server: settles a city on the pantheons map preset with the 210
// Faith a pantheon and then the world's first religion cost (the startingFaith game option), and
// founds the Sacred Path pantheon. The turn button then reads Found Religion and opens the religion
// founding window, where Islam is founded with Initiation Rites, whose 100 Gold arrives for the one
// city, and Feed the World. Ends on the faith button's religion window showing the religion.
export function setupFoundReligionTest(game: Game) {
    const runner = new TestRunner("FoundReligion");
    const utils = new TestUtils(game);
    let goldBefore = 0;

    const me = () => utils.getClientPlayer();
    const scene = () => utils.getInGameScene();
    const nextTurnText = () => scene().getNextTurnButton().getText();
    const religionNotification = () => scene().getNotifications().getAll().find((notification) => notification.type === "religion");
    const founding = () => scene().getReligionFoundingWindow();

    runner.addStep({
        name: `Start with ${PANTHEON_COST + RELIGION_COST} Faith, settle a city and found a pantheon`,
        action: async () => {
            await utils.ensureInGame({
                allowBarbarians: false,
                revealMap: true,
                mapPreset: "pantheons",
                startingFaith: PANTHEON_COST + RELIGION_COST
            });
            const settler = await utils.findUnitWithAction("settle");
            WebsocketClient.sendMessage({
                event: "unitAction",
                unitX: settler.getTile().getGridX(),
                unitY: settler.getTile().getGridY(),
                id: settler.getID(),
                actionName: "settle"
            });
            await utils.waitUntil(() => me().getCities().length > 0, 5000, "City to be founded");
            scene().focusOnTile(me().getCities()[0].getTile(), 3);
            WebsocketClient.sendMessage({ event: "foundPantheon", name: "Sacred Path" });
            await utils.waitUntil(() => me().getFaithBreakdown().pantheon?.name === "Sacred Path", 5000, "The pantheon to be founded");
        },
        verification: () => me().getAccumulatedStat("faith") === RELIGION_COST
    });

    runner.addStep({
        name: "The faith is enough for a religion: a notification says so, and the turn button reads Found Religion",
        action: async () => {
            await utils.skipIdleUnits();
            await utils.waitUntil(() => nextTurnText() === "Found Religion", 5000, "The turn button to read Found Religion");
        },
        verification: () => !!religionNotification() && nextTurnText() === "Found Religion"
    });

    runner.addStep({
        name: "Click Found Religion: the window lists 13 religions, 9 founder beliefs and 16 follower beliefs",
        action: async () => {
            scene().getNextTurnButton().call("clicked");
            await utils.waitUntil(() => founding()?.getChoices().religion.length === 13, 5000, "The religion founding window to fill");
        },
        verification: () =>
            founding().getChoices().founderBelief.length === 9 && founding().getChoices().followerBelief.length === 16
    });

    runner.addStep({
        name: `Choose ${RELIGION}, ${FOUNDER_BELIEF} and ${FOLLOWER_BELIEF}, hovering ${FOUNDER_BELIEF} for its tooltip`,
        action: async () => {
            founding().choose("religion", RELIGION);
            founding().choose("founderBelief", FOUNDER_BELIEF);
            founding().choose("followerBelief", FOLLOWER_BELIEF);
            founding().showTooltipFor(FOUNDER_BELIEF);
            await utils.waitUntil(() => !!founding().getTooltip(), 3000, "The belief tooltip to open");
            await utils.delay(1500);
        },
        verification: () => {
            const chosen = founding().getChosen();
            return chosen.religion === RELIGION && chosen.founderBelief === FOUNDER_BELIEF && chosen.followerBelief === FOLLOWER_BELIEF;
        }
    });

    runner.addStep({
        name: `Found Religion: the window closes, the Faith is spent, and ${FOUNDER_BELIEF} pays ${INITIATION_RITES_GOLD} Gold for the city`,
        action: async () => {
            goldBefore = me().getAccumulatedStat("gold");
            founding().found();
            await utils.waitUntil(() => me().getFaithBreakdown().religion === RELIGION, 5000, "The religion to be founded");
        },
        verification: () =>
            !founding() &&
            me().getAccumulatedStat("faith") === 0 &&
            me().getAccumulatedStat("gold") === goldBefore + INITIATION_RITES_GOLD &&
            !religionNotification() &&
            nextTurnText() !== "Found Religion"
    });

    runner.addStep({
        name: `Click the faith button: the religion window shows ${RELIGION} with both beliefs`,
        action: async () => {
            scene().toggleReligionUI();
            await utils.waitUntil(() => !!scene().getReligionWindow()?.getOverview(), 5000, "The religion window to fill");
        },
        verification: () => {
            const overview = scene().getReligionWindow().getOverview();
            return (
                overview.religion?.name === RELIGION &&
                overview.founderBelief?.name === FOUNDER_BELIEF &&
                overview.followerBelief?.name === FOLLOWER_BELIEF
            );
        }
    });

    return runner;
}
