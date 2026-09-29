import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { City } from "../../city/City";
import { ChooseProductionList, ProductionListMode } from "../../ui/windows/city/ChooseProductionList";
import { CityBuildingsWindow } from "../../ui/windows/city/CityBuildingsWindow";
import { Label } from "../../ui/components/Label";
import { TestUtils } from "../TestUtils";

const SECTIONS = ["Units", "Buildings", "National Wonders", "Great Wonders", "Citizen Management"];

// Great and national wonders get their own sections in Choose Production and in the city's buildings,
// and each can only be built once: a great wonder once in the world, a national wonder once per
// civilization. Starts with every tech and production costs at 1% (the productionCostPercent game
// option), so anything queued is finished the next turn. Ends with the city screen open on its
// Great Wonders and Notre Dame's tooltip showing, to look over by eye.
export function setupWondersTest(game: Game) {
    const runner = new TestRunner("Wonders");
    const utils = new TestUtils(game);
    let city: City | undefined;

    const me = () => utils.getClientPlayer();
    const scene = () => utils.getInGameScene() as unknown as Record<string, any>;
    const cityScreen = () => scene()["cityDisplayInfo"] as Record<string, any> | undefined;
    const openList = (): ChooseProductionList | undefined => cityScreen()?.["chooseProductionList"];
    const rowTexts = (listBox: object | undefined): string[] =>
        ((listBox as Record<string, any>)?.["rows"] ?? []).map((row: any) => row.getLabel().getText() as string);
    // The rows under each section heading, with the turns stripped from a production row's text.
    const sectionsOf = (texts: string[]): Record<string, string[]> => {
        const sections: Record<string, string[]> = {};
        let current = "";
        for (const text of texts) {
            if (SECTIONS.includes(text)) {
                current = text;
                sections[current] = [];
            } else if (current) {
                sections[current].push(text.replace(/\s*\(\d+ turns?\)$/, ""));
            }
        }
        return sections;
    };
    const listSections = (mode: ProductionListMode) =>
        openList()?.getMode() === mode ? sectionsOf(rowTexts(openList())) : {};
    const buildingsWindow = (): CityBuildingsWindow | undefined =>
        (cityScreen()?.["actors"] as object[] | undefined)?.find((actor) => actor instanceof CityBuildingsWindow) as CityBuildingsWindow;
    const buildingSections = () => sectionsOf(rowTexts(buildingsWindow()));
    // Scrolls the open list to the row for `name`, then moves the real mouse over it.
    const hoverListRow = async (name: string) => {
        const list = openList() as unknown as Record<string, any>;
        const findRow = () => (list["rows"] as any[]).find((row) => row.getLabel().getText().replace(/\s*\(\d+\u00a0turns?\)$/, "") === name);
        list["setScrollOffset"](list["scrollOffset"] + findRow().getY() - list["y"] - 100);
        await utils.delay(200);
        const row = findRow();
        const canvas = document.getElementById("canvas");
        canvas.dispatchEvent(new MouseEvent("mousemove", { clientX: row.getX() + 60, clientY: row.getY() + row.getHeight() / 2 }));
        await utils.waitUntil(() => tooltipLines()[0] === name, 5000, `${name}'s tooltip to appear`);
    };
    const tooltipLines = (): string[] => {
        const tooltip = (openList() as unknown as Record<string, any>)?.["tooltip"];
        return tooltip ? tooltip.getActors().filter((actor: object) => actor instanceof Label).map((label: Label) => label.getText()) : [];
    };
    const hasBuilding = (name: string) => city.getBuildings().some((building) => building.getName() === name);

    const openCityList = async (mode: ProductionListMode) => {
        if (cityScreen()) utils.getInGameScene().toggleCityUI(city);
        utils.getInGameScene().toggleCityUI(city);
        await utils.waitUntil(() => !!cityScreen(), 5000, "City screen to open");
        cityScreen()["toggleList"](mode);
        await utils.waitUntil(() => Object.keys(listSections(mode)).length > 0, 5000, `${mode} list to appear`);
    };
    const buildNow = async (name: string) => {
        WebsocketClient.sendMessage({ event: "addToProductionQueue", cityName: city.getName(), type: "building", name });
        await utils.waitUntil(() => city.getProductionQueue().some((item) => item.name === name), 5000, `${name} to be queued`);
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        await utils.waitUntil(() => hasBuilding(name), 5000, `${name} to be built`);
    };

    runner.addStep({
        name: "Start with every tech and 1% production costs, and settle a city",
        action: async () => {
            await utils.ensureInGame({
                allowBarbarians: false,
                numCityStates: 0,
                startWithAllTechs: true,
                productionCostPercent: 1
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
            city = me().getCities()[0];
            await utils.waitUntil(() => city.hasStats(), 5000, "City stats to arrive");
        },
        verification: () => city !== undefined
    });

    runner.addStep({
        name: "Choose Production lists great wonders under their own heading, not under Buildings",
        action: async () => {
            await openCityList("produce");
            utils.log(JSON.stringify(listSections("produce")), "yellow");
        },
        verification: () => {
            const sections = listSections("produce");
            return (
                ["Oracle", "Temple of Artemis", "Great Library", "Notre Dame"].every((name) => sections["Great Wonders"]?.includes(name)) &&
                !sections["Buildings"].includes("Oracle") &&
                sections["Buildings"].includes("Library") &&
                // No Library yet, so no National College, and so no National Wonders section at all.
                sections["National Wonders"] === undefined
            );
        }
    });

    runner.addStep({
        name: "Hovering a building shows what it gives and its upkeep",
        action: async () => {
            await hoverListRow("Walls");
            utils.log(JSON.stringify(tooltipLines()), "yellow");
        },
        verification: () =>
            JSON.stringify(tooltipLines()) === JSON.stringify(["Walls", "+5 Defense", "+50 City Health", "-1 Gold per turn upkeep"])
    });

    runner.addStep({
        name: "Hovering a great wonder says it's one in the world",
        action: async () => {
            await hoverListRow("Temple of Artemis");
            utils.log(JSON.stringify(tooltipLines()), "yellow");
        },
        verification: () =>
            JSON.stringify(tooltipLines()) ===
            JSON.stringify(["Temple of Artemis", "Great Wonder: only one in the world", "+3 Food", "+1 Culture"])
    });

    runner.addStep({
        name: "Once the city has a Library, the National College shows under National Wonders",
        action: async () => {
            await buildNow("Library");
            await openCityList("produce");
        },
        verification: () =>
            !!listSections("produce")["National Wonders"]?.includes("National College") &&
            !listSections("produce")["Buildings"].includes("National College")
    });

    runner.addStep({
        name: "Gold can't buy wonders: the purchase list has no wonder sections",
        action: async () => openCityList("purchase"),
        verification: () => {
            const sections = listSections("purchase");
            return sections["Great Wonders"] === undefined && sections["National Wonders"] === undefined;
        }
    });

    runner.addStep({
        name: "Build the Oracle and the National College",
        action: async () => {
            await buildNow("Oracle");
            await buildNow("National College");
        },
        verification: () => hasBuilding("Oracle") && hasBuilding("National College")
    });

    runner.addStep({
        name: "Neither is offered again",
        action: async () => openCityList("produce"),
        verification: () => {
            const sections = listSections("produce");
            return !sections["Great Wonders"]?.includes("Oracle") && sections["National Wonders"] === undefined;
        }
    });

    runner.addStep({
        name: "The city's buildings list wonders under their own headings",
        action: async () => {
            await buildNow("Temple of Artemis");
            await buildNow("Great Library");
            await openCityList("produce");
            utils.log(JSON.stringify(buildingSections()), "yellow");
        },
        verification: () => {
            const sections = buildingSections();
            return (
                sections["Buildings"].includes("Library") &&
                !sections["Buildings"].includes("Oracle") &&
                sections["National Wonders"]?.includes("National College") &&
                ["Oracle", "Temple of Artemis", "Great Library"].every((name) => sections["Great Wonders"]?.includes(name))
            );
        }
    });

    runner.addStep({
        name: "Leave Notre Dame's tooltip showing, to look at",
        action: async () => hoverListRow("Notre Dame"),
        verification: () => tooltipLines().includes("+15 Morale")
    });

    return runner;
}
