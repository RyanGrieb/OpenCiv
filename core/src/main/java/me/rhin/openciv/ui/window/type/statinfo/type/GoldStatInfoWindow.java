package me.rhin.openciv.ui.window.type.statinfo.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.type.statinfo.StatInfoWindow;

public class GoldStatInfoWindow extends StatInfoWindow {

	private CustomLabel totalIncomeLabel;
	private CustomLabel cityIncomeLabel;

	private CustomLabel totalExpensesLabel;
	private CustomLabel buildingExpensesLabel;
	private CustomLabel unitExpensesLabel;

	public GoldStatInfoWindow(float x, float y) {
		super(x, y);

		float goldFromCities = 0;

		Player player = Civilization.getInstance().getGame().getPlayer();

		for (City city : player.getOwnedCities()) {
			goldFromCities += city.getStatLine().getStatValue(Stat.GOLD_GAIN);
		}

		float totalIncome = 0;
		totalIncome += goldFromCities;

		totalIncomeLabel = new CustomLabel("+" + totalIncome + " in total income");
		totalIncomeLabel.setPosition(4, getHeight() - 15);
		addActor(totalIncomeLabel);

		cityIncomeLabel = new CustomLabel("		* +" + goldFromCities + " from all cities");
		cityIncomeLabel.setPosition(4, totalIncomeLabel.getY() - 15);
		addActor(cityIncomeLabel);

		float buildingExpenses = 0;

		for (City city : player.getOwnedCities()) {
			buildingExpenses += city.getStatLine().getStatValue(Stat.MAINTENANCE);
		}

		float unitMaintenance = player.getOwnedUnits().size() * 0.25F;

		float totalExpenses = 0;
		totalExpenses += buildingExpenses;
		totalExpenses += unitMaintenance;

		totalExpensesLabel = new CustomLabel((totalExpenses > 0 ? "-" : "") + totalExpenses + " in total expenses");
		totalExpensesLabel.setPosition(4, cityIncomeLabel.getY() - 25);
		addActor(totalExpensesLabel);

		this.buildingExpensesLabel = new CustomLabel("		* " + (buildingExpenses > 0 ? "-" : "") + buildingExpenses
				+ " spent on building\n		maintenance");
		buildingExpensesLabel.setPosition(4, totalExpensesLabel.getY() - 35);
		addActor(buildingExpensesLabel);

		this.unitExpensesLabel = new CustomLabel(
				"		* " + (unitMaintenance > 0 ? "-" : "") + unitMaintenance + " spent on unit\n		maintenance");
		unitExpensesLabel.setPosition(4, buildingExpensesLabel.getY() - 35);
		addActor(unitExpensesLabel);
	}

}
