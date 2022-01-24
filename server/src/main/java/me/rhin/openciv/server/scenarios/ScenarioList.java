package me.rhin.openciv.server.scenarios;

import java.util.HashMap;

import me.rhin.openciv.server.scenarios.type.CityStateAITestScenario;
import me.rhin.openciv.server.scenarios.type.FloodScenario;

public class ScenarioList {

	private HashMap<String, Scenario> scenarios;

	public ScenarioList() {
		scenarios = new HashMap<>();

		scenarios.put("flood", new FloodScenario());
		scenarios.put("citystateai", new CityStateAITestScenario());
	}

	public Scenario byName(String name) {
		return scenarios.get(name);
	}

}
