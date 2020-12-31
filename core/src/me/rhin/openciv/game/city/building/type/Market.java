package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.specialist.Specialist;
import me.rhin.openciv.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.stat.Stat;

public class Market extends Building implements SpecialistContainer {

	public Market(City city) {
		super(city);

		this.statLine.addValue(Stat.GOLD_GAIN, 2);
	}

	@Override
	public int getProductionCost() {
		return 100;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_MARKET;
	}

	@Override
	public String getName() {
		return "Market";
	}

	@Override
	public int getSpecialistSlots() {
		return 1;
	}

	@Override
	public SpecialistType getSpecialistType() {
		return SpecialistType.MERCHANT;
	}

	@Override
	public void addSpecialist() {

	}

	@Override
	public void removeSpecialist() {

	}
}
